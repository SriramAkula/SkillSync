# Payment Gateway — SkillSync

> **Port:** 8089 | **Database:** `skill_payment` | **Spring Boot:** 3.4.11

The Payment Gateway service integrates with Razorpay for order creation and HMAC-SHA256 signature verification. It implements the **Saga pattern** for transactional payment state management with idempotency guarantees — one `PaymentSaga` per `sessionId`.

---

## 📦 Package Structure

```
com.skillsync.paymentgateway
├── controller/
│   └── PaymentController           # POST /payment/create-order, /verify, /payments (webhook), GET /history
├── service/
│   ├── SagaOrchestrator            # Manages PaymentSaga state transitions
│   └── PaymentProcessor            # Razorpay API integration (order creation + signature verification)
├── client/
│   ├── MentorServiceClient         # Feign → Mentor Service (fetch hourly rate)
│   └── SessionServiceClient        # Feign → Session Service (update session status to COMPLETED)
├── consumer/
│   └── SessionEventListener        # (Listens for session events to correlate payments)
├── repository/
│   └── PaymentSagaRepository
├── mapper/
│   └── PaymentSagaMapper
├── audit/
│   └── AuditService / AuditLog
├── config/
│   └── RabbitMQConfig
└── entity/
    ├── PaymentSaga                 # {id, sessionId, learnerId, mentorId, correlationId, status, razorpayOrderId, amount}
    └── SagaStatus                  # INITIATED, ORDER_CREATED, PAYMENT_VERIFIED, PAYMENT_FAILED, COMPLETED, COMPENSATED
```

---

## 🌐 REST API

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/payment/create-order` | ✅ | Create Razorpay order; persist PaymentSaga (INITIATED) |
| `POST` | `/payment/verify` | ✅ | Verify Razorpay HMAC signature; complete saga |
| `GET`  | `/payment/history?page=&size=` | ✅ | Paginated payment history for learner |
| `POST` | `/payment/payments` | ❌ | Razorpay webhook receiver (server-side confirmation) |

---

## 🔄 Payment Saga State Machine

```
[*] → INITIATED        : POST /payment/create-order
INITIATED → ORDER_CREATED   : Razorpay order created successfully
ORDER_CREATED → PAYMENT_VERIFIED : POST /payment/verify (HMAC valid)
ORDER_CREATED → PAYMENT_FAILED   : HMAC invalid / timeout
PAYMENT_VERIFIED → COMPLETED     : System confirms
PAYMENT_FAILED → COMPENSATED     : Refund triggered (if applicable)
COMPLETED → [*]
COMPENSATED → [*]
```

---

## 🔐 Idempotency

```java
// One PaymentSaga per session — prevents duplicate charges
@Column(name = "session_id", unique = true)
private Long sessionId;  // Idempotency key

@Column(name = "correlation_id", unique = true)
private String correlationId; // UUID for distributed tracing
```

---

## 🔒 Webhook Signature Verification

```java
// HMAC-SHA256 verification
String expectedSignature = HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, keySecret);
if (!expectedSignature.equals(receivedSignature)) throw new PaymentProcessingException("Invalid signature");
```

---

## 🗄️ Database Schema (skill_payment)

```sql
CREATE TABLE payment_sagas (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id          BIGINT UNIQUE NOT NULL,
    learner_id          BIGINT NOT NULL,
    mentor_id           BIGINT NOT NULL,
    correlation_id      VARCHAR(100) UNIQUE NOT NULL,
    status              ENUM('INITIATED','ORDER_CREATED','PAYMENT_VERIFIED','PAYMENT_FAILED','COMPLETED','COMPENSATED'),
    razorpay_order_id   VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    amount              DECIMAL(10, 2),
    currency            VARCHAR(10) DEFAULT 'INR',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔗 Inter-Service Dependencies

- **Feign → Mentor Service**: Fetch mentor hourly rate for order amount calculation
- **Feign → Session Service**: `PUT /session/{id}/status` to mark session COMPLETED on payment
- **External → Razorpay API**: Order creation and payment verification
- **External ← Razorpay Webhook**: Server-side payment confirmation (HMAC-SHA256)

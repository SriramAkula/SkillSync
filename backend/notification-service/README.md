# Notification Service — SkillSync

> **Port:** 8088 | **Database:** `skill_notification` | **Spring Boot:** 3.4.11

The Notification Service is a pure event consumer — it listens to RabbitMQ domain events, renders Thymeleaf HTML email templates, dispatches them via SMTP (JavaMailSender), and persists notification records in MySQL for in-app display.

---

## 📦 Package Structure

```
com.skillsync.notificationservice
├── controller/
│   └── NotificationController      # GET /notifications/* — notification history
├── service/
│   ├── NotificationService (interface)
│   ├── NotificationCommandService  # Persist notification + send email
│   └── NotificationQueryService    # Fetch notification history (paginated)
├── consumer/
│   ├── SessionRequestedEventConsumer  # @RabbitListener: session.requested
│   ├── SessionAcceptedEventConsumer   # @RabbitListener: session.accepted
│   ├── SessionRejectedEventConsumer   # @RabbitListener: session.rejected
│   ├── SessionCancelledEventConsumer  # @RabbitListener: session.cancelled
│   ├── ReviewSubmittedEventConsumer   # @RabbitListener: review.submitted
│   └── MentorApprovedEventConsumer    # @RabbitListener: mentor.approved
├── client/
│   ├── UserServiceClient           # Feign → User Service (fetch email/name)
│   ├── UserServiceClientFallback   # Circuit-breaker fallback
│   ├── MentorServiceClient         # Feign → Mentor Service (fetch mentor details)
│   └── MentorServiceClientFallback
├── service/
│   └── EmailService                # JavaMailSender + Thymeleaf template rendering
├── repository/
│   └── NotificationRepository
├── config/
│   ├── RabbitMQConfig              # Declares all queues and bindings
│   ├── RedisConfig                 # Notification caching
│   ├── EmailConfig                 # JavaMailSender SMTP config
│   └── SecurityConfig
└── entity/
    └── Notification                # {id, recipientId, type, title, message, isRead, createdAt}
```

---

## 🌐 REST API

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET`  | `/notifications?page=&size=` | ✅ | Get my notification history (paginated) |
| `PUT`  | `/notifications/{id}/read` | ✅ | Mark notification as read |

---

## 📥 RabbitMQ Events Consumed

| Queue | Routing Key | Trigger | Email Recipient |
|-------|-------------|---------|-----------------|
| `session.requested.queue` | `session.requested` | Learner books session | Mentor |
| `session.accepted.queue` | `session.accepted` | Mentor accepts | Learner |
| `session.rejected.queue` | `session.rejected` | Mentor rejects | Learner |
| `session.cancelled.queue` | `session.cancelled` | Session cancelled | Both parties |
| `review.submitted.queue` | `review.submitted` | Learner submits review | Mentor |
| `mentor.approved.queue` | `mentor.approved` | Admin approves mentor | Mentor |

---

## 📧 Email Templates (Thymeleaf HTML)

| Template | Event |
|----------|-------|
| `session-requested.html` | Mentor receives new booking request |
| `session-accepted.html` | Learner's session was accepted |
| `session-rejected.html` | Learner's session was rejected |
| `session-cancelled.html` | Session cancelled |
| `review-submitted.html` | Mentor received a new review |
| `welcome.html` | New user registered |

---

## 🗄️ Database Schema (skill_notification)

```sql
CREATE TABLE notifications (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    recipient_id BIGINT NOT NULL,
    type         VARCHAR(100),
    title        VARCHAR(255),
    message      TEXT,
    is_read      BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔗 Inter-Service Dependencies

- **Consumes from RabbitMQ**: session.*, review.submitted, mentor.approved
- **Feign → User Service**: Resolve recipient email/name for email dispatch
- **Feign → Mentor Service**: Resolve mentor details for email content
- **SMTP**: JavaMailSender via Gmail/custom SMTP (TLS port 587)

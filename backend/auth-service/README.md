# Auth Service — SkillSync

> **Port:** 8081 | **Database:** `skill_auth` | **Spring Boot:** 3.4.11

The Auth Service is the identity and security backbone of SkillSync. It handles user registration, login (local + Google OAuth2), JWT issuance, OTP-based verification, and password resets. It publishes `UserCreatedEvent` and `UserUpdatedEvent` to RabbitMQ for downstream sync.

---

## 📦 Package Structure

```
com.skillsync.authservice
├── controller/
│   ├── AuthController              # POST /auth/* — public auth endpoints
│   └── internal/
│       └── InternalUserController  # GET /auth/internal/user/{userId} — Feign endpoint
├── service/
│   ├── AuthService (interface)
│   ├── AuthServiceImpl             # Core login/register/OTP/reset-password logic
│   ├── OAuthService                # Google ID token verification (Google API)
│   └── OtpService                  # OTP generation, storage in Redis (5-min TTL)
├── security/
│   ├── JwtUtil                     # JWT sign/validate/parse (HS256)
│   ├── JwtFilter                   # OncePerRequestFilter — validates JWT on each request
│   ├── CustomUserDetails           # UserDetails adapter
│   ├── CustomUserDetailsService    # Loads user from DB by email
│   ├── InternalServiceFilter       # Validates X-Internal-Secret header for Feign calls
│   ├── GatewayRequestFilter        # Ensures requests came through API Gateway
│   └── SecurityExceptionHandler    # AuthenticationEntryPoint + AccessDeniedHandler
├── publisher/
│   └── AuthEventPublisher          # Publishes events to skillsync.auth.exchange
├── client/
│   └── UserServiceClient           # Feign client → User Service (profile sync)
├── event/
│   ├── UserCreatedEvent            # {userId, email, name, role, username}
│   └── UserUpdatedEvent            # {userId, name, avatarUrl}
├── audit/
│   ├── AuditService                # Logs auth events to audit_logs table
│   └── AuditLog                   # AuditLog entity
├── config/
│   ├── RabbitMQConfig              # Declares skillsync.auth.exchange (TOPIC)
│   ├── RedisConfig                 # Refresh token store (TTL: 7 days)
│   ├── SecurityConfig              # Permits public endpoints; chains security filters
│   ├── JwtConfig                   # JWT secret + expiry from Config Server
│   ├── EmailConfig                 # JavaMailSender SMTP setup
│   └── FeignConfig                 # Feign client configuration
├── mapper/
│   └── AuthMapper                  # Entity ↔ DTO mapping
├── logging/
│   └── LoggingAspect               # AOP logging for service methods
└── entity/
    └── User                        # {id, email, passwordHash, name, role, authProvider, isVerified, isBlocked}
```

---

## 🌐 REST API

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/auth/register` | ❌ | Register with email/password; triggers OTP email |
| `POST` | `/auth/send-otp` | ❌ | Resend OTP to email |
| `POST` | `/auth/verify-otp` | ❌ | Verify OTP; activate account |
| `POST` | `/auth/login` | ❌ | Email/password → JWT + refresh token |
| `POST` | `/auth/oauth/google` | ❌ | Google ID Token → JWT |
| `POST` | `/auth/refresh` | ❌ | Rotate JWT via HttpOnly refresh token cookie |
| `POST` | `/auth/forgot-password` | ❌ | Send password reset OTP |
| `POST` | `/auth/verify-forgot-password` | ❌ | Validate reset OTP |
| `POST` | `/auth/reset-password` | ❌ | Set new password with valid OTP |
| `GET`  | `/auth/internal/user/{userId}` | X-Internal-Secret | Internal Feign endpoint |

---

## 🔐 JWT Token Structure

```json
{
  "sub": "user@email.com",
  "userId": 42,
  "roles": ["ROLE_LEARNER"],
  "iat": 1746789012,
  "exp": 1746792612
}
```

- **Access Token**: Short-lived (configurable expiry), stored in `localStorage`
- **Refresh Token**: Long-lived (7 days), stored in Redis, returned as HttpOnly cookie

---

## 📤 RabbitMQ Events Published

| Event | Exchange | Routing Key | Payload |
|-------|----------|-------------|---------|
| `UserCreatedEvent` | `skillsync.auth.exchange` | `user.created` | `{userId, email, name, role, username}` |
| `UserUpdatedEvent` | `skillsync.auth.exchange` | `user.updated` | `{userId, name, avatarUrl}` |

---

## 🗄️ Database Schema (skill_auth)

```sql
CREATE TABLE users (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name          VARCHAR(255),
    username      VARCHAR(255) UNIQUE,
    role          ENUM('ROLE_LEARNER', 'ROLE_MENTOR', 'ROLE_ADMIN') NOT NULL,
    auth_provider ENUM('LOCAL', 'GOOGLE') DEFAULT 'LOCAL',
    is_verified   BOOLEAN DEFAULT FALSE,
    is_blocked    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## ⚙️ Key Configuration (config-repo/auth-service.properties)

```properties
spring.data.redis.host=redis
spring.data.redis.port=6379
spring.rabbitmq.host=rabbitmq
jwt.secret=<HS256-signing-key>
jwt.expiry=3600000
spring.mail.host=smtp.gmail.com
spring.mail.port=587
google.client-id=<google-oauth2-client-id>
```

---

## 🔗 Inter-Service Dependencies

- **Publishes to RabbitMQ**: `user.created`, `user.updated`
- **Redis**: OTP storage (5-min TTL) + Refresh token storage (7-day TTL)
- **Feign → User Service**: Profile sync on update

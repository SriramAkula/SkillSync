# Review Service — SkillSync

> **Port:** 8087 | **Database:** `skill_review` | **Spring Boot:** 3.4.11

The Review Service handles learner-submitted star ratings and optional text reviews for completed mentor sessions. It publishes `ReviewSubmittedEvent` to RabbitMQ, which triggers both a mentor rating update and an email notification.

---

## 📦 Package Structure

```
com.skillsync.reviewservice
├── controller/
│   └── ReviewController            # All /review/* endpoints
├── service/
│   ├── ReviewService (interface)
│   ├── ReviewServiceImpl           # Delegates to Command/Query service
│   ├── ReviewCommandService        # Write: submitReview + publish event
│   └── ReviewQueryService          # Read: getByMentor, getByLearner
├── repository/
│   └── ReviewRepository
├── client/
│   ├── MentorServiceClient         # Feign → Mentor Service (trigger rating update)
│   └── MentorServiceFallback       # Circuit-breaker fallback
├── mapper/
│   └── ReviewMapper                # Entity ↔ DTO
├── audit/
│   └── AuditService / AuditLog
├── config/
│   ├── RedisConfig
│   └── SecurityConfig
└── entity/
    └── Review                      # {id, learnerId, mentorId, sessionId, rating, comment, isAnonymous}
```

---

## 🌐 REST API

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| `POST` | `/review` | ✅ | Learner | Submit a review (1–5 stars, optional comment, optional anonymous) |
| `GET`  | `/review/mentor/{mentorId}?page=&size=` | ✅ | Any | All reviews for a mentor (paginated) |
| `GET`  | `/review/my?page=&size=` | ✅ | Learner | My submitted reviews (paginated) |

---

## 📤 RabbitMQ Events Published

| Event | Exchange | Routing Key | Payload |
|-------|----------|-------------|---------|
| `ReviewSubmittedEvent` | `skillsync.review.exchange` | `review.submitted` | `{reviewId, mentorId, learnerId, rating}` |

Consumed by:
- **Mentor Service**: Recomputes mentor's average rating
- **Notification Service**: Sends email to mentor ("You received a new review")

---

## 🗄️ Database Schema (skill_review)

```sql
CREATE TABLE reviews (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    learner_id   BIGINT NOT NULL,
    mentor_id    BIGINT NOT NULL,
    session_id   BIGINT,
    rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔗 Inter-Service Dependencies

- **Publishes to RabbitMQ**: `review.submitted`
- **Feign → Mentor Service**: Direct rating update call (with Resilience4j circuit breaker fallback)

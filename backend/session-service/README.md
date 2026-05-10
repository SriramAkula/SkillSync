# Session Service — SkillSync

> **Port:** 8084 | **Database:** `skill_session` | **Spring Boot:** 3.4.11

The Session Service handles the full booking lifecycle — request, accept, reject, cancel — following a **CQRS pattern** (Command/Query Responsibility Segregation). Double-booking prevention is enforced through application-level time-range checks backed by a MySQL UNIQUE constraint. Session events are published to RabbitMQ to trigger email notifications.

---

## 📦 Package Structure

```
com.skillsync.session
├── controller/
│   └── SessionController           # Routes to Command or Query service
├── service/
│   ├── SessionService (interface)
│   ├── SessionServiceImpl           # Delegates to Command/Query service
│   ├── command/
│   │   └── SessionCommandService   # Writes: requestSession, acceptSession, rejectSession, cancelSession, updateStatus
│   └── query/
│       └── SessionQueryService     # Reads: getSession, getSessionsForMentor, getSessionsForLearner, getPendingSessions
├── repository/
│   └── SessionRepository           # JPA repository + custom JPQL queries (findSessionsInTimeRange, findPendingSessions)
├── client/
│   └── UserClient                  # Feign → User Service (blocked-user check, participant details)
├── event/
│   ├── SessionRequestedEvent       # {sessionId, mentorId, learnerId, scheduledAt, durationMinutes}
│   ├── SessionAcceptedEvent        # {sessionId, mentorId, learnerId}
│   ├── SessionRejectedEvent        # {sessionId, mentorId, learnerId, reason}
│   └── SessionCancelledEvent       # {sessionId, mentorId, learnerId}
├── publisher/
│   └── SessionEventPublisher       # Publishes to skillsync.session.exchange
├── mapper/
│   └── SessionMapper               # Entity ↔ DTO mapping
├── audit/
│   └── AuditService / AuditLog    # Audit trail for session state changes
├── config/
│   ├── RabbitMQConfig              # Declares skillsync.session.exchange (TOPIC)
│   ├── RedisConfig                 # Cache for session responses (60-min TTL)
│   ├── SecurityConfig              # Permits /internal/**, /actuator/**
│   └── FeignConfig                 # Feign client configuration
└── entity/
    ├── Session                     # {id, learnerId, mentorId, skillId, scheduledAt, durationMinutes, status, rejectionReason}
    └── SessionStatus               # REQUESTED, ACCEPTED, REJECTED, CANCELLED, COMPLETED
```

---

## 🌐 REST API

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| `POST` | `/session` | ✅ | Learner | Request a new session |
| `GET`  | `/session/{id}` | ✅ | Any | Get session details |
| `GET`  | `/session/mentor/{mentorId}?page=&size=` | ✅ | Mentor/Admin | Sessions for a mentor (paginated) |
| `GET`  | `/session/learner/{learnerId}?page=&size=` | ✅ | Any | Sessions for a learner (paginated) |
| `GET`  | `/session/pending` | ✅ | Admin | All REQUESTED sessions |
| `PUT`  | `/session/{id}/accept` | ✅ | Mentor | Accept a session request |
| `PUT`  | `/session/{id}/reject` | ✅ | Mentor | Reject a session request (with reason) |
| `PUT`  | `/session/{id}/cancel` | ✅ | Any | Cancel a REQUESTED or ACCEPTED session |
| `PUT`  | `/session/{id}/status` | X-Gateway-Request | Internal | Update status (called by Payment Service) |

---

## 🔄 Session State Machine

```
[*] → REQUESTED  : Learner books session
REQUESTED → ACCEPTED  : Mentor accepts
REQUESTED → REJECTED  : Mentor rejects (+ reason)
REQUESTED → CANCELLED : Learner cancels before response
ACCEPTED  → CANCELLED : Either party cancels
ACCEPTED  → COMPLETED : (Future: automated after session time)
REJECTED  → [*]
CANCELLED → [*]
COMPLETED → [*]
```

---

## 🛡️ Double-Booking Prevention

```java
// Layer 1: Application check — query for conflicts in time range
List<Session> conflicts = sessionRepository.findSessionsInTimeRange(
    mentorId,
    scheduledAt.minusMinutes(duration),
    scheduledAt.plusMinutes(duration)
);
if (!conflicts.isEmpty()) throw new SessionConflictException("Conflicting session exists");

// Layer 2: MySQL UNIQUE constraint (safety net)
UNIQUE KEY unique_booking (mentor_id, scheduled_at)
```

---

## 📤 RabbitMQ Events Published

| Event | Routing Key | Trigger |
|-------|-------------|---------|
| `SessionRequestedEvent` | `session.requested` | On booking creation |
| `SessionAcceptedEvent` | `session.accepted` | On mentor accept |
| `SessionRejectedEvent` | `session.rejected` | On mentor reject |
| `SessionCancelledEvent` | `session.cancelled` | On cancellation |

---

## 🗄️ Database Schema (skill_session)

```sql
CREATE TABLE sessions (
    id               BIGINT PRIMARY KEY AUTO_INCREMENT,
    learner_id       BIGINT NOT NULL,
    mentor_id        BIGINT NOT NULL,
    skill_id         BIGINT,
    scheduled_at     DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    status           ENUM('REQUESTED','ACCEPTED','REJECTED','CANCELLED','COMPLETED') NOT NULL,
    rejection_reason TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_booking (mentor_id, scheduled_at)
);
```

---

## 🔗 Inter-Service Dependencies

- **Feign → User Service**: Checks blocked status before booking; fetches participant details
- **Publishes to RabbitMQ**: `session.requested`, `session.accepted`, `session.rejected`, `session.cancelled`
- **Redis**: Session response caching (`@Cacheable`, `@CacheEvict`) with 60-min TTL
- **Called by Payment Service**: `PUT /session/{id}/status` to mark session as COMPLETED

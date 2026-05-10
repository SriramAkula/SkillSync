# Mentor Service — SkillSync

> **Port:** 8085 | **Database:** `skill_mentor` | **Spring Boot:** 3.4.11

The Mentor Service manages mentor applications, approval workflows, availability, and search/filter. It follows a **CQRS pattern** (Command/Query split). Mentor ratings are updated asynchronously when `ReviewSubmittedEvent` is consumed from RabbitMQ.

---

## 📦 Package Structure

```
com.skillsync.mentorservice
├── controller/
│   └── MentorController            # All /mentor/* endpoints
├── service/
│   ├── MentorService (interface)
│   ├── MentorServiceImpl           # Delegates to Command/Query service
│   ├── MentorCommandService        # Writes: apply, approve, reject, suspend, updateAvailability, updateRating
│   └── MentorQueryService          # Reads: getById, getApproved, getPending, search, getByUserId
├── client/
│   ├── AuthServiceClient           # Feign → Auth Service (role promotion)
│   └── ReviewClient                # Feign → Review Service (review details)
├── event/
│   └── MentorApprovedEvent         # {mentorId, userId, email}
├── publisher/
│   └── (via RabbitMQConfig)        # Events published on approval
├── consumer/
│   └── (rating update via Feign call from Review Service via RabbitMQ consumer in Mentor)
├── audit/
│   └── AuditService / AuditLog
├── config/
│   ├── RabbitMQConfig
│   ├── RedisConfig                 # Mentor profile caching
│   ├── SecurityConfig
│   └── FeignConfig
├── mapper/
│   └── MentorMapper                # Entity ↔ DTO
└── entity/
    ├── MentorProfile               # {id, userId, specialization, experienceYears, hourlyRate, rating, status, availabilityStatus}
    ├── MentorStatus                # PENDING, APPROVED, REJECTED, SUSPENDED
    └── AvailabilityStatus          # AVAILABLE, UNAVAILABLE
```

---

## 🌐 REST API

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| `POST` | `/mentor/apply` | ✅ | Learner/Mentor | Submit mentor application |
| `GET`  | `/mentor/{mentorId}` | ✅ | Any | Get mentor profile by ID |
| `GET`  | `/mentor/profile/me` | ✅ | Mentor | Own mentor profile |
| `GET`  | `/mentor/approved?page=&size=` | ✅ | Any | All approved mentors (paginated) |
| `GET`  | `/mentor/pending?page=&size=` | ✅ | Admin | Pending applications (paginated) |
| `GET`  | `/mentor/search?skill=&minExp=&maxRate=&minRating=` | ✅ | Any | Filter mentors |
| `PUT`  | `/mentor/{id}/approve` | ✅ | Admin | Approve application |
| `PUT`  | `/mentor/{id}/reject` | ✅ | Admin | Reject application |
| `PUT`  | `/mentor/{id}/suspend` | ✅ | Admin | Suspend mentor |
| `PUT`  | `/mentor/availability` | ✅ | Mentor | Update availability (AVAILABLE/UNAVAILABLE) |
| `PUT`  | `/mentor/{id}/rating` | X-Gateway-Request | Internal | Update mentor rating (called on review event) |
| `GET`  | `/mentor/internal/{mentorId}` | X-Gateway-Request | Internal | Internal Feign endpoint |

---

## 🔄 Mentor Status State Machine

```
[*] → PENDING   : Learner submits application
PENDING → APPROVED  : Admin approves (triggers role promotion)
PENDING → REJECTED  : Admin rejects
APPROVED → SUSPENDED : Admin suspends
SUSPENDED → APPROVED : Admin re-approves
REJECTED → [*]
```

---

## 🔐 Authorization Pattern

```java
// Header-based role check (from X-User-Id / roles headers injected by API Gateway)
@RequestHeader(value = "roles", required = false) String roles

if (roles == null || !roles.contains("ROLE_ADMIN")) {
    throw new UnauthorizedException("Only admins can approve mentors");
}
```

---

## 🗄️ Database Schema (skill_mentor)

```sql
CREATE TABLE mentor_profiles (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id             BIGINT UNIQUE NOT NULL,
    specialization      VARCHAR(255),
    experience_years    INT,
    hourly_rate         DECIMAL(10, 2),
    rating              DECIMAL(3, 2) DEFAULT 0.0,
    status              ENUM('PENDING','APPROVED','REJECTED','SUSPENDED') DEFAULT 'PENDING',
    availability_status ENUM('AVAILABLE','UNAVAILABLE') DEFAULT 'AVAILABLE',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔗 Inter-Service Dependencies

- **Feign → Auth Service**: Role promotion from ROLE_LEARNER to ROLE_MENTOR on approval
- **Feign → Review Service**: Fetch review details (via `ReviewClient`)
- **Consumes from RabbitMQ**: `review.submitted` → recomputes average rating
- **Redis**: Mentor profile caching

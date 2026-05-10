# User Service — SkillSync

> **Port:** 8082 | **Database:** `skill_user` | **Spring Boot:** 3.4.11

The User Service manages extended user profiles, admin block/unblock capabilities, and profile caching. It is a pure consumer of Auth Service events — it never calls Auth Service directly. User profiles are cached in Redis for fast lookups.

---

## 📦 Package Structure

```
com.skillsync.userservice
├── controller/
│   └── UserProfileController       # GET/PUT /users/*, admin block/unblock, internal Feign
├── service/
│   ├── UserProfileService (interface)
│   ├── UserProfileServiceImpl       # Profile CRUD + Redis cache-aside pattern
│   ├── UserProfileCommandService    # Write operations: update, block, unblock
│   ├── UserProfileQueryService      # Read operations: get by ID, search, list
│   └── UserAdminService             # Admin-only: block/unblock with reason
├── consumer/
│   └── UserProfileEventListener    # @RabbitListener for UserCreatedEvent / UserUpdatedEvent
├── client/
│   ├── AuthClient                   # Feign → Auth Service (profile update sync)
│   └── ReviewClient                 # Feign → Review Service (mentor ratings)
├── config/
│   ├── RabbitMQConfig              # Queue: user.queue, user.updated.queue
│   ├── RedisConfig                 # user_profile_{userId} keys (10-min TTL)
│   ├── SecurityConfig              # Permits /internal/**, /actuator/**
│   ├── MinioConfig                 # MinIO object storage for avatars
│   └── FeignConfig                 # Feign client configuration
├── audit/
│   └── AuditService / AuditLog    # Event audit trail
├── mapper/
│   └── UserProfileMapper           # Entity ↔ DTO mapping
└── entity/
    └── UserProfile                 # {userId, name, email, bio, avatarUrl, location, phone, role, isBlocked}
```

---

## 🌐 REST API

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| `GET`  | `/users/{id}` | ✅ | Any | Get user profile by ID |
| `GET`  | `/users/me` | ✅ | Any | Get own profile |
| `PUT`  | `/users/me` | ✅ | Any | Update own profile (bio, avatar, phone, location) |
| `GET`  | `/users?search=&page=&size=` | ✅ | Any | Search/list users (paginated) |
| `PUT`  | `/users/{id}/block` | ✅ | Admin | Block user with reason |
| `PUT`  | `/users/{id}/unblock` | ✅ | Admin | Unblock user |
| `GET`  | `/users/internal/{id}` | X-Gateway-Request | — | Internal Feign lookup |

---

## 🔄 Redis Cache Strategy

```
Key:   user_profile_{userId}
Value: Serialized UserProfile JSON
TTL:   10 minutes

Cache-Aside Pattern:
  GET → Check Redis → If miss → Query DB → Store in Redis → Return
  PUT → Update DB → Evict Redis key → Return
```

---

## 📥 RabbitMQ Events Consumed

| Queue | Event | Action |
|-------|-------|--------|
| `user.queue` | `UserCreatedEvent` | Creates UserProfile record in `skill_user` DB |
| `user.updated.queue` | `UserUpdatedEvent` | Updates name, avatarUrl; evicts Redis cache |

---

## 🗄️ Database Schema (skill_user)

```sql
CREATE TABLE user_profiles (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id      BIGINT UNIQUE NOT NULL,
    email        VARCHAR(255),
    name         VARCHAR(255),
    username     VARCHAR(255),
    bio          TEXT,
    avatar_url   VARCHAR(500),
    phone        VARCHAR(20),
    location     VARCHAR(255),
    role         VARCHAR(50),
    is_blocked   BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔗 Inter-Service Dependencies

- **Consumes from RabbitMQ**: `user.created`, `user.updated`
- **Redis**: Profile caching (10-min TTL)
- **Feign → Auth Service**: Profile update sync
- **MinIO**: Avatar/file storage

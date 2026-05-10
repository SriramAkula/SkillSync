# Skill Service — SkillSync

> **Port:** 8083 | **Database:** `skill_skill` | **Spring Boot:** 3.4.11

The Skill Service manages the platform's skill catalog — creating, browsing, searching, and paginating skills. Skills are referenced by Mentor and Group services for profile linking and group creation.

---

## 📦 Package Structure

```
com.skillsync.skillservice
├── controller/
│   └── SkillController             # GET/POST /skills/* endpoints
├── service/
│   ├── SkillService (interface)
│   ├── SkillServiceImpl            # Delegates to Command/Query service
│   ├── SkillCommandService         # Writes: createSkill
│   └── SkillQueryService           # Reads: getById, getAll (paginated), search
├── repository/
│   └── SkillRepository             # JPA repository
├── mapper/
│   └── SkillMapper                 # Entity ↔ DTO
├── audit/
│   └── AuditService / AuditLog
├── config/
│   ├── RedisConfig                 # Skill catalog caching
│   └── SecurityConfig
└── entity/
    └── Skill                       # {id, name, category, description, createdAt}
```

---

## 🌐 REST API

| Method | Path | Auth | Role | Description |
|--------|------|:----:|------|-------------|
| `GET`  | `/skills?page=&size=` | ✅ | Any | List all skills (paginated) |
| `GET`  | `/skills/{id}` | ✅ | Any | Get skill by ID |
| `GET`  | `/skills/search?name=` | ✅ | Any | Search skills by name |
| `POST` | `/skills` | ✅ | Admin | Create a new skill |

---

## 🗄️ Database Schema (skill_skill)

```sql
CREATE TABLE skills (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) UNIQUE NOT NULL,
    category    VARCHAR(255),
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔗 Inter-Service Dependencies

- **Referenced by** Mentor Service (mentor specialization linkage)
- **Referenced by** Group Service (study group skill tag)
- **Redis**: Skill catalog caching (reduces DB load for frequently-accessed skill lists)

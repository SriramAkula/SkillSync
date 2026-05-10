# Group Service — SkillSync

> **Port:** 8086 | **Database:** `skill_group` | **Spring Boot:** 3.4.11

The Group Service manages study groups — creation, browsing, membership (join/leave), and member listing. Each group is tied to a skill. Unique membership is enforced via a DB constraint, and group capacity is controlled via `GroupFullException`.

---

## 📦 Package Structure

```
com.skillsync.groupservice
├── controller/
│   └── GroupController             # All /groups/* endpoints
├── service/
│   ├── GroupService (interface)
│   ├── GroupServiceImpl            # Delegates to Command/Query service
│   ├── GroupCommandService         # Writes: create, join, leave
│   └── GroupQueryService           # Reads: getAll, getById, getMembers
├── repository/
│   ├── GroupRepository
│   └── GroupMemberRepository
├── client/
│   ├── UserServiceClient           # Feign → User Service (user validation)
│   └── SkillServiceClient          # Feign → Skill Service (skill validation)
├── mapper/
│   └── GroupMapper                 # Entity ↔ DTO
├── audit/
│   └── AuditService / AuditLog
├── config/
│   ├── RedisConfig
│   ├── SecurityConfig
│   └── FeignConfig
└── entity/
    ├── Group                       # {id, name, description, skillId, creatorId, maxMembers}
    ├── GroupMember                 # {id, groupId, userId, role, joinedAt}
    └── MemberRole                  # ADMIN, MEMBER
```

---

## 🌐 REST API

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/groups` | ✅ | Create a study group |
| `GET`  | `/groups?page=&size=` | ✅ | Browse all groups (paginated) |
| `GET`  | `/groups/{id}` | ✅ | Group details |
| `POST` | `/groups/{id}/join` | ✅ | Join group (duplicate membership → 409) |
| `DELETE` | `/groups/{id}/leave` | ✅ | Leave group |
| `GET`  | `/groups/{id}/members` | ✅ | Group member list |

---

## 🛡️ Constraints

```java
// Unique membership — prevents a user from joining the same group twice
@UniqueConstraint(columnNames = {"group_id", "user_id"}, name = "uk_group_user")
// → Throws AlreadyMemberException (mapped to 409 Conflict)

// Group capacity
if (group.getMembers().size() >= group.getMaxMembers()) throw new GroupFullException();
```

---

## 🗄️ Database Schema (skill_group)

```sql
CREATE TABLE study_groups (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    skill_id    BIGINT,
    creator_id  BIGINT NOT NULL,
    max_members INT DEFAULT 50,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    id        BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id  BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    role      ENUM('ADMIN', 'MEMBER') DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_group_user (group_id, user_id)
);
```

---

## 🔗 Inter-Service Dependencies

- **Feign → User Service**: Validate user existence before joining
- **Feign → Skill Service**: Validate skill existence when creating group

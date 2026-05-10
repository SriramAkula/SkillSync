# Messaging Service — SkillSync ⏳

> **Port:** 8090 | **Database:** `skill_messaging` | **Spring Boot:** 3.4.11
> **Status:** Infrastructure ready — REST messaging API implemented; WebSocket/STOMP integration pending

The Messaging Service provides direct 1:1 messaging between users. The core REST API for sending and retrieving messages is implemented and functional. WebSocket/STOMP real-time delivery is under development.

---

## 📦 Package Structure

```
com.skillsync.messagingservice
├── controller/
│   └── MessageController           # POST /messages, GET /messages/conversation/{userId}
├── service/
│   ├── MessageService (interface)
│   ├── MessageCommandService       # Write: sendMessage
│   └── MessageQueryService         # Read: getConversation (paginated)
├── repository/
│   └── MessageRepository
├── client/
│   ├── UserServiceClient           # Feign → User Service (user validation)
│   └── UserServiceClientFallback   # Circuit-breaker fallback
├── publisher/
│   └── MessageEventPublisher       # Publishes to RabbitMQ (for future real-time routing)
├── config/
│   ├── RabbitMQConfig
│   ├── RedisConfig
│   └── SecurityConfig
└── entity/
    └── Message                     # {id, senderId, receiverId, content, sentAt, isRead}
```

---

## 🌐 REST API (Implemented)

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/messages` | ✅ | Send a message to another user |
| `GET`  | `/messages/conversation/{userId}?page=&size=` | ✅ | Get conversation with a user (paginated) |

---

## ⏳ WebSocket / STOMP (Under Development)

```
WS  /ws-messaging               → Connect to chat
STOMP /user/queue/messages      → Subscribe to personal message queue
STOMP /topic/group/{groupId}    → Subscribe to group chat topic
```

- ✅ Nginx WebSocket upgrade headers configured
- ✅ API Gateway `/api/messages/**` route configured
- ⏳ STOMP broker relay (RabbitMQ) — pending
- ⏳ Frontend `ChatStore` integration — partially implemented

---

## 🗄️ Database Schema (skill_messaging)

```sql
CREATE TABLE messages (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id   BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content     TEXT NOT NULL,
    sent_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read     BOOLEAN DEFAULT FALSE
);
```

---

## 🔗 Inter-Service Dependencies

- **Feign → User Service**: Validate sender/receiver existence
- **RabbitMQ**: Message event publishing (for future real-time routing)

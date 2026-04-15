# SkillSync Backend Services - Complete Documentation Index

This document provides a comprehensive index of all SkillSync backend microservices and their documentation.

---

## 🏗️ Service Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Angular)                        │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Port 9090)                     │
│        - Request Routing - JWT Validation - Rate Limiting       │
└─────────────────────────────────────────────────────────────────┘
                               ↓
        ┌──────────────────────┬──────────────────────┐
        ↓                      ↓                      ↓
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │ Core    │          │ Feature │          │ Support │
    │Services │          │Services │          │Services │
    └─────────┘          └─────────┘          └─────────┘
        │                     │                    │
        ↓                     ↓                    ↓
    [Auth, User]     [Session, Review]    [Notification]
    [Config, Eureka]  [Mentor, Skill]     [Payment]
                      [Group, Messaging]

        ↓                     ↓                    ↓
    ┌─────────────┬─────────────────┬─────────────────────┐
    ↓             ↓                 ↓                     ↓
  MySQL      RabbitMQ            Redis            Monitoring
```

---

## 📚 Service Documentation

### Core Services (Foundation)

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **[Auth Service](auth-service/README.md)** | 8081 | Authentication, JWT tokens, login/register | ✅ |
| **[User Service](user-service/README.md)** | 8082 | User profiles, blocking, search | ✅ |
| **[Eureka Server](eureka-server/README.md)** | 8761 | Service discovery & registration | ✅ |
| **[Config Server](config-server/README.md)** | 8888 | Centralized configuration management | ✅ |

### Feature Services (Business Logic)

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **[Session Service](session-service/README.md)** | 8088 | Session booking, status management | ✅ |
| **[Mentor Service](mentor-service/README.md)** | 8083 | Mentor profiles, skills, availability | ✅ |
| **[Skill Service](skill-service/README.md)** | 8085 | Skill catalog, categories, search | ✅ |
| **[Review Service](review-service/README.md)** | 8086 | Ratings, reviews, feedback | ✅ |
| **[Group Service](group-service/README.md)** | 8084 | Groups, membership, collaboration | ✅ |
| **[Messaging Service](messaging-service/README.md)** | 8089 | Real-time chat, WebSocket messaging | ✅ |

### Support Services (Infrastructure)

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **[Notification Service](notification-service/README.md)** | 8087 | Emails, in-app notifications, preferences | ✅ |
| **[Payment Gateway](payment-gateway/README.md)** | 8080 | Payment processing, billing, invoicing | ✅ |
| **[API Gateway](api-gateway/README.md)** | 9090 | Request routing, auth, rate limiting | ✅ |

---

## 🚀 Quick Service Lookup

### I want to...

- **Manage User Authentication** → [Auth Service](auth-service/README.md)
- **Update User Profiles** → [User Service](user-service/README.md)
- **Book Sessions** → [Session Service](session-service/README.md)
- **Manage Mentor Details** → [Mentor Service](mentor-service/README.md)
- **View Skills** → [Skill Service](skill-service/README.md)
- **Submit Reviews** → [Review Service](review-service/README.md)
- **Send Notifications** → [Notification Service](notification-service/README.md)
- **Chat with Users** → [Messaging Service](messaging-service/README.md)
- **Create Groups** → [Group Service](group-service/README.md)
- **Process Payments** → [Payment Gateway](payment-gateway/README.md)
- **Configure Services** → [Config Server](config-server/README.md)
- **Discover Services** → [Eureka Server](eureka-server/README.md)
- **Route Requests** → [API Gateway](api-gateway/README.md)

---

## 🔄 Service Dependencies

### Auth Service (8081)
- **Depends On**: None (foundational)
- **Used By**: All services for JWT validation
- **Database**: MySQL `skill_auth`

### User Service (8082)
- **Depends On**: Auth Service (validation)
- **Used By**: Session, Mentor, Review services
- **Database**: MySQL `skill_users`

### Session Service (8088)
- **Depends On**: User Service, Mentor Service
- **Used By**: Review, Payment, Notification services
- **Database**: MySQL `skill_sessions`
- **Locking**: Redis (double-booking prevention)
- **Events**: RabbitMQ (publishes SessionRequested, SessionAccepted, etc.)

### Mentor Service (8083)
- **Depends On**: User Service, Skill Service
- **Used By**: Session, Review services
- **Database**: MySQL `skill_mentors`

### Skill Service (8085)
- **Depends On**: None
- **Used By**: Mentor, Session, Review services
- **Database**: MySQL `skill_skills`

### Review Service (8086)
- **Depends On**: Session Service
- **Used By**: Mentor Service (for rating updates)
- **Database**: MySQL `skill_reviews`
- **Events**: RabbitMQ (ReviewSubmitted)

### Notification Service (8087)
- **Depends On**: None (event consumer)
- **Used By**: All services (sends notifications)
- **Database**: MySQL `skill_notifications`
- **Queue**: RabbitMQ (consumes SessionRequested, ReviewSubmitted, etc.)

### Messaging Service (8089)
- **Depends On**: None
- **Used By**: Frontend for real-time chat
- **Database**: MySQL `skill_messaging`
- **WebSocket**: STOMP over SockJS
- **Message Broker**: RabbitMQ

### Group Service (8084)
- **Depends On**: User Service
- **Used By**: Messaging Service (sends group messages)
- **Database**: MySQL `skill_groups`

### Payment Gateway (8080)
- **Depends On**: Session Service
- **Used By**: Frontend for payment processing
- **Database**: MySQL `skill_payments`
- **External**: Stripe/Razorpay API

### API Gateway (9090)
- **Depends On**: All services
- **Used By**: Frontend clients
- **No Database**: Routing service only

### Config Server (8888)
- **Depends On**: None
- **Used By**: All services (on startup)
- **Storage**: Git repository

### Eureka Server (8761)
- **Depends On**: None
- **Used By**: All services (service discovery)
- **Storage**: In-memory registry

---

## 📊 Port Configuration

```
Public Entry Point:
  API Gateway          → 9090 ✓

Core Backend Services:
  Config Server        → 8888
  Eureka Server        → 8761
  
Microservices:
  Auth Service         → 8081
  User Service         → 8082
  Mentor Service       → 8083
  Group Service        → 8084
  Skill Service        → 8085
  Review Service       → 8086
  Notification Service → 8087
  Session Service      → 8088
  Messaging Service    → 8089
  Payment Gateway      → 8080

Database:
  MySQL                → 3306
  
Cache & Messaging:
  Redis                → 6379
  RabbitMQ             → 5672 (AMQP)
  RabbitMQ Management  → 15672 (UI)
  RabbitMQ STOMP       → 61613
```

---

## 🔐 Security Model

### Authentication Flow
```
1. Frontend: POST /auth/login with email/password
   ↓
2. Auth Service: Validates credentials, generates JWT
   ↓
3. Frontend: Stores JWT token
   ↓
4. Frontend: Includes "Authorization: Bearer <token>" in requests
   ↓
5. API Gateway: Validates JWT, extracts userId
   ↓
6. API Gateway: Adds X-User-Id header to request
   ↓
7. Service: Processes request with authenticated userId
```

### Authorization by Role
```
ROLE_LEARNER:
  - View mentor profiles
  - Request sessions
  - Submit reviews
  - Join groups
  - Send messages

ROLE_MENTOR:
  - Manage own profile
  - Accept/reject sessions
  - Update availability
  - View reviews
  - Send messages

ROLE_ADMIN:
  - Block/unblock users
  - Moderate reviews
  - View analytics
  - Manage system settings
```

---

## 📡 Event-Driven Architecture

### Event Publishers & Consumers

**Session Service (Publisher)**
- `SessionRequestedEvent` → Notification, Mentor services
- `SessionAcceptedEvent` → Notification service
- `SessionCancelledEvent` → Notification, Calendar services
- `SessionCompletedEvent` → Review service

**Review Service (Publisher)**
- `ReviewSubmittedEvent` → Mentor (update ratings), Notification services

**Notification Service (Consumer)**
- All events listed above → Sends emails/notifications

**Message Broker**: RabbitMQ with TOPIC exchanges

---

## 🗂️ Database Overview

### MySQL Databases

```
skill_auth         → Users, refresh tokens (Auth Service)
skill_users        → User profiles, blocking info (User Service)
skill_sessions     → Sessions, acceptance status (Session Service)
skill_mentors      → Mentor profiles, skills, ratings (Mentor Service)
skill_skills       → Skill catalog, categories (Skill Service)
skill_reviews      → Session reviews, ratings (Review Service)
skill_notifications → Notifications, preferences (Notification Service)
skill_messaging    → Chat messages history (Messaging Service)
skill_groups       → Groups, memberships (Group Service)
skill_payments     → Transactions, refunds (Payment Gateway)
```

### Redis (Caching & Locking)

```
Keys:
  skill_profile_{userId}              → User profile cache
  skill_mentor_{mentorId}             → Mentor profile cache
  skill_skill_{skillId}               → Skill cache
  session-lock:{mentorId}:{timestamp} → Double-booking lock
  
TTL: 10 minutes (default for most caches)
Lock Duration: 30 seconds
```

---

## 🚀 Deployment Checklist

### Per-Service Checklist

- [ ] Database schema created and migrated
- [ ] Environment variables configured
- [ ] Service registered with Eureka
- [ ] Config fetched from Config Server
- [ ] Health check endpoint accessible
- [ ] Logging configured and working
- [ ] Metrics available via /actuator
- [ ] Dependent services accessible

### System-Wide Checklist

- [ ] MySQL running with all databases
- [ ] Redis running for caching
- [ ] RabbitMQ running for messaging
- [ ] Eureka Server running and accessible
- [ ] Config Server running and accessible
- [ ] API Gateway running and routing
- [ ] All microservices registered in Eureka
- [ ] Frontend can reach API Gateway
- [ ] SSL/TLS configured for production

---

## 📊 API Summary

### Request Pattern
```
POST http://localhost:9090/{service-path}
Header: Authorization: Bearer <JWT_TOKEN>
Header: Content-Type: application/json

Response:
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "statusCode": 200
}
```

### Error Response Pattern
```
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly message",
  "statusCode": 400
}
```

### Common Status Codes
```
200 OK                  → Request successful
201 Created             → Resource created
204 No Content          → Successful delete/update
400 Bad Request         → Invalid input
401 Unauthorized        → Missing/invalid JWT
403 Forbidden           → Insufficient permissions
404 Not Found           → Resource doesn't exist
409 Conflict            → Business rule violation (e.g., double-booking)
500 Internal Server Error → Server error
503 Service Unavailable → Downstream service unreachable
```

---

## 🔗 External Integrations

| Service | Integration | Purpose |
|---------|-------------|---------|
| Auth Service | JWT Library | Token generation/validation |
| Notification Service | Email (SMTP) | Send welcome emails, notifications |
| Payment Gateway | Stripe/Razorpay API | Process payments |
| Messaging Service | WebSocket/STOMP | Real-time chat |
| Session Service | Redis | Distributed locking |
| All Services | Eureka | Service discovery |
| All Services | Config Server | Centralized configuration |

---

## 📚 Quick Reference Files

- **Configuration Details**: Each service has `application.properties` in `src/main/resources/`
- **Docker Setup**: See `docker-compose.*.yml` files in backend root
- **Database Schemas**: See `src/main/java/*/entity/` packages
- **DTOs/Models**: See `src/main/java/*/dto/` packages
- **API Documentation**: Each service has Swagger/OpenAPI available at `/v3/api-docs`

---

## 🔄 Common Tasks

### Add a New Microservice

1. Create new Maven project in `backend/new-service/`
2. Add dependencies (Spring Boot, Spring Data, Spring Cloud)
3. Create main Application class with `@SpringBootApplication`
4. Add `application.properties` with Eureka registration
5. Create controllers, services, entities
6. Add to `docker-compose.yml`
7. Write README.md

### Deploy to Production

1. Build all services: `./mvnw clean package`
2. Push images to Docker registry
3. Update `docker-compose.prod.yml` with image versions
4. Configure environment variables
5. Run: `docker-compose -f docker-compose.prod.yml up -d`
6. Verify all services registered in Eureka
7. Monitor logs: `docker-compose logs -f <service>`

### Scale a Service

```bash
# Run multiple instances
docker-compose up -d --scale session-service=3

# API Gateway auto-discovers and load-balances
```

---

## 📞 Support & Troubleshooting

For common issues, see the troubleshooting section in each service's README:

- [Auth Service Troubleshooting](auth-service/README.md#troubleshooting)
- [Session Service Troubleshooting](session-service/README.md#troubleshooting)
- [Messaging Service Troubleshooting](messaging-service/README.md#troubleshooting)
- [API Gateway Troubleshooting](api-gateway/README.md#troubleshooting)

---

## 📝 License

Part of SkillSync Platform. All rights reserved.

---

## 📋 Document Version

- **Created**: April 14, 2026
- **Last Updated**: April 14, 2026
- **Version**: 1.0.0
- **Maintainer**: SkillSync Development Team

# SkillSync — High Level Design (HLD)

> **Version:** 2.0 | **Date:** May 2026 | **Status:** Production Ready

---

## 1. System Overview

**SkillSync** is a cloud-native, microservices-based **Mentor-Learner Platform** connecting skilled mentors with learners seeking structured guidance. The system operates as a comprehensive marketplace enabling learner-to-mentor discovery, 1:1 session booking with built-in payment processing, collaborative study group formation, rating/review collection, and real-time notifications.

The platform is deployed on an **Azure VM** running Docker Compose, with all services containerized, monitored, and managed through a robust CI/CD pipeline backed by GitHub Actions and Azure Container Registry.

---

## 2. Problem Statement & Objectives

### 2.1 Problem Statement

In the current e-learning landscape, aspiring learners lack a structured, accountable way to connect with domain experts for personalized guidance. Existing solutions either suffer from poor discoverability (unstructured freelancer platforms) or rigid curricula (structured MOOCs). There is a clear need for a platform that:
- Allows learners to **discover verified experts** by skill, experience, and rating
- Enables **structured, paid 1:1 mentorship sessions** with lifecycle management
- Provides **community collaboration** through study groups
- Ensures **quality assurance** via a review and rating system
- Delivers **transactional transparency** through integrated payments and notifications

### 2.2 Platform Objectives

| Objective | Implementation |
|-----------|---------------|
| Mentor Discovery | Searchable, filtered mentor catalog with ratings, specialization, and hourly rate |
| Session Management | Full booking lifecycle (Request → Accept/Reject → Cancel/Complete) with double-booking prevention |
| Payment Processing | Razorpay-integrated payment saga with idempotency guarantees |
| Quality Assurance | Star-rating review system that automatically updates mentor scores |
| Community | Study groups organized by skill with membership management |
| Reliability | Event-driven notifications via RabbitMQ; SMTP email delivery |
| Security | JWT-based authentication, role-based access, and isolated service networks |

---

## 3. Functional Requirements

### 3.1 Authentication & Identity
- FR-01: Users shall register with email/password; OTP verification required before account activation
- FR-02: System shall support Google OAuth2 login as an alternative authentication method
- FR-03: System shall issue short-lived JWT access tokens and long-lived refresh tokens (HttpOnly cookie)
- FR-04: System shall support forgot-password and reset-password flows via OTP
- FR-05: API Gateway shall validate every JWT and propagate identity headers (`X-User-Id`, `roles`) to downstream services

### 3.2 User Management
- FR-06: Users shall maintain extended profiles (bio, avatar, skills, phone, location)
- FR-07: Admins shall be able to block/unblock any user account with reason and audit trail
- FR-08: User profiles shall be cached in Redis with 10-minute TTL

### 3.3 Mentor Management
- FR-09: Any Learner shall be able to apply to become a mentor by submitting specialization, experience, and hourly rate
- FR-10: Admin shall review and approve, reject, or suspend mentor applications
- FR-11: Approved mentors shall manage their availability status (AVAILABLE / UNAVAILABLE)
- FR-12: Mentor catalog shall be searchable/filterable by skill, experience range, max rate, and min rating

### 3.4 Session Booking
- FR-13: Learners shall be able to request sessions specifying mentor, skill, date/time, and duration
- FR-14: System shall prevent double-booking a mentor at the same time using MySQL UNIQUE constraints and service-level checks
- FR-15: Mentors shall accept or reject session requests with optional rejection reasons
- FR-16: Both learners and mentors shall be able to cancel sessions with a status transition

### 3.5 Payments
- FR-17: Learners shall initiate payments through Razorpay order creation
- FR-18: System shall verify payment signatures (HMAC-SHA256) server-side before confirming payment
- FR-19: Payment records shall follow a Saga pattern ensuring idempotency (one PaymentSaga per sessionId)
- FR-20: Razorpay shall deliver webhook events for server-side payment confirmation

### 3.6 Reviews & Ratings
- FR-21: Learners shall submit 1–5 star reviews with optional text comments after completed sessions
- FR-22: Reviews may be submitted anonymously
- FR-23: Mentor's average rating shall be automatically recomputed on each new review via event-driven update

### 3.7 Study Groups
- FR-24: Any authenticated user shall be able to create a study group tied to a skill
- FR-25: Users shall browse and join/leave existing study groups
- FR-26: Group membership shall be unique per group (no duplicate members)

### 3.8 Notifications
- FR-27: System shall send email notifications on key domain events: session requested, accepted, rejected, review submitted
- FR-28: Notifications shall be persisted in the database for in-app display
- FR-29: Notification delivery shall be event-driven and decoupled from source services via RabbitMQ

---

## 4. Non-Functional Requirements

### 4.1 Performance
| Requirement | Target | Implementation |
|-------------|--------|---------------|
| API response time | < 200ms (p95) for cached reads | Redis cache-aside on user/skill profiles (10min TTL) |
| Session booking throughput | Supports concurrent booking requests | MySQL UNIQUE constraints prevent race conditions |
| Pagination | Configurable page size (default 12) | Spring Data JPA `Pageable` throughout |

### 4.2 Security
| Requirement | Implementation |
|-------------|---------------|
| Authentication | JWT (HS256), short-lived access tokens (configurable expiry) |
| Authorization | Role-based header enforcement at both Gateway and service level |
| Network isolation | Internal services on `skillsync-private` bridge (no external access) |
| Payment security | HMAC-SHA256 webhook signature verification |
| Token storage | Access token in localStorage; refresh token in HttpOnly cookie |
| Service-to-service | `X-Gateway-Request` header validates requests came through API Gateway |

### 4.3 Scalability
| Concern | Strategy |
|---------|---------|
| Horizontal scaling | Stateless services; any instance can serve any request |
| Service discovery | Eureka + Spring Cloud LoadBalancer round-robin |
| Caching | Redis reduces database load for hot data |
| Double-booking | DB UNIQUE INDEX + Application checks ensures correctness at scale |
| Configuration | Spring Cloud Config Server; property changes without restarts |

### 4.4 Reliability
| Requirement | Implementation |
|-------------|---------------|
| Auto-recovery | `restart: unless-stopped` on all Docker containers |
| Circuit breaking | Resilience4j circuit breakers on all Feign HTTP calls |
| Database health | Docker healthchecks; services only start after DB is healthy |
| Event delivery | RabbitMQ durable queues; messages survive broker restart |

### 4.5 Observability
| Concern | Tool |
|---------|------|
| Distributed tracing | Zipkin (Micrometer Brave bridge); TraceId/SpanId in all log lines |
| Metrics | Prometheus scrapes `/actuator/prometheus` on all services |
| Dashboards | Grafana for JVM, HTTP, and business metrics |
| Log aggregation | Promtail → Loki; searchable via Grafana Explore |

### 4.6 Maintainability
| Requirement | Implementation |
|-------------|---------------|
| Code quality | SonarCloud quality gate (>75% backend coverage, >85% frontend coverage) |
| API documentation | SpringDoc OpenAPI (Swagger UI) on every service |
| Linting | ESLint (TypeScript strict mode) on frontend |
| Standard response format | Unified `ApiResponse<T>` and `PageResponse<T>` wrapper on all APIs |

---

## 5. System Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: CLIENT                                                │
│  Angular 18 SPA (NgRx Signal Store, Tailwind CSS, RxJS)        │
│  Served via Nginx (Docker container, port 80/443)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│  LAYER 2: EDGE                                                  │
│  Nginx Reverse Proxy (SSL Termination, WebSocket Upgrade)       │
│  Docker: skillsync-proxy network                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  LAYER 3: API GATEWAY (Port 9090)                              │
│  Spring Cloud Gateway + JwtAuthenticationFilter                │
│  → Validates JWT, injects X-User-Id / roles headers            │
│  → Path-based routing to downstream services                   │
│  → Eureka load-balanced routing (lb://service-name)            │
└───────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┘
        │      │      │      │      │      │      │      │
┌───────▼──────▼──────▼──────▼──────▼──────▼──────▼──────▼───────┐
│  LAYER 4: MICROSERVICES                                         │
│  Auth  User  Skill  Session  Mentor  Group  Review  Payment     │
│  8081  8082  8083   8084     8085    8086   8087    8089         │
│  + Notification (8088)                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  LAYER 5: EVENT BUS                                             │
│  RabbitMQ (TOPIC Exchange: skillsync.*.exchange)               │
│  Routing Keys: user.created, session.*, review.*               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  LAYER 6: DATA                                                  │
│  MySQL 8.0 (10 isolated DBs)  │  Redis 7 (Cache)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  LAYER 7: OBSERVABILITY                                         │
│  Prometheus → Grafana    │   Promtail → Loki   │   Zipkin       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Inter-Module Communication

### 6.1 Synchronous — Feign Clients (HTTP)

Used for real-time queries where response is needed immediately:

| Caller | Target | Purpose |
|--------|--------|---------|
| Session Service | User Service | Fetch participant name/email for session detail responses |
| Session Service | Mentor Service | Validate mentor exists before booking |
| Mentor Service | User Service | Resolve user profile for mentor card display |

**Resilience:** Resilience4j circuit breakers with fallback factory patterns on all Feign calls. If downstream service is down, a degraded but functional response is returned.

### 6.2 Asynchronous — RabbitMQ TOPIC Exchange

Used for decoupled event propagation (publisher does not need to know consumers):

| Event | Publisher | Consumer(s) | Routing Key |
|-------|-----------|-------------|-------------|
| `UserCreatedEvent` | Auth Service | User Service | `user.created` |
| `UserUpdatedEvent` | Auth Service | User Service | `user.updated` |
| `SessionRequestedEvent` | Session Service | Notification Service | `session.requested` |
| `SessionAcceptedEvent` | Session Service | Notification Service | `session.accepted` |
| `SessionRejectedEvent` | Session Service | Notification Service | `session.rejected` |
| `SessionCancelledEvent` | Session Service | Notification Service | `session.cancelled` |
| `ReviewSubmittedEvent` | Review Service | Notification Service + Mentor Service | `review.submitted` |
| `PaymentCompletedEvent` | Payment Service | (Future consumers) | `payment.completed` |

---

## 7. External Integrations

| Integration | Service | Protocol | Purpose |
|-------------|---------|----------|---------|
| **Google OAuth2** | Auth Service | REST/HTTPS | Validate Google ID token; create/login user |
| **Razorpay** | Payment Service | REST/HTTPS | Order creation, payment verification |
| **Razorpay Webhooks** | Payment Service | HTTPS POST | Server-side payment event confirmation |
| **SMTP / Gmail** | Notification Service | SMTP (TLS) | Transactional email delivery |
| **Azure Container Registry** | CI/CD | Docker Registry | Store and pull production Docker images |
| **SonarCloud** | CI/CD | REST | Code quality analysis and coverage reporting |
| **Zipkin** | All Services | HTTP | Distributed trace reporting |

---

## 8. High-Level Data Flow

### 8.1 Typical Learner Flow (Session Booking)
```
Learner (Browser)
  → POST /api/sessions (JWT)
  → API Gateway validates JWT, adds X-User-Id / roles
  → Session Service: validates request and checks for conflicts
  → Session Service: creates Session record (status=REQUESTED)
  → Session Service: publishes SessionRequestedEvent to RabbitMQ
  → Notification Service: receives event, sends email to Mentor
  → Response: 201 Created (session details)
```

### 8.2 Auth Flow (Login)
```
Learner (Browser)
  → POST /api/auth/login (email + password)
  → Auth Service: validates credentials (BCrypt)
  → Auth Service: generates JWT (userId, email, roles)
  → Auth Service: stores refresh token in Redis
  → Response: { token, roles, userId, email }
  → Frontend: stores token in localStorage; refresh token in HttpOnly cookie
```

### 8.3 Event-Driven Rating Update
```
Learner submits review
  → Review Service: saves Review
  → Review Service: publishes ReviewSubmittedEvent (mentorId, rating)
  → Mentor Service: receives event, recomputes average rating, saves
  → Notification Service: receives event, emails mentor "You received a review"
```

---

## 9. Security Architecture

### 9.1 Authentication & Token Flow
```
1. Login → Auth Service issues JWT (HS256, configurable expiry)
2. JWT contains: { sub: email, userId, roles, iat, exp }
3. Frontend stores JWT in localStorage (access token)
4. Refresh token stored in HttpOnly cookie (not accessible to JS)
5. Every API request → Authorization: Bearer <JWT>
6. API Gateway filter validates JWT → injects X-User-Id, roles headers
7. Downstream services trust these headers (no re-validation)
```

### 9.2 Network Isolation
- `skillsync-private` (internal Docker bridge): All microservices, databases, Redis, RabbitMQ — **not reachable from outside**
- `skillsync-proxy` (external Docker bridge): Only Nginx, API Gateway, Auth Service, Notification Service, Payment Gateway

### 9.3 Internal Service Security
- `GatewayRequestFilter` in each downstream service: rejects requests missing `X-Gateway-Request` header (prevents direct access bypass)
- Auth Service `InternalServiceFilter`: validates `X-Internal-Secret` for Feign-to-Feign calls

---

## 10. Scalability Design

| Concern | Strategy |
|---------|---------|
| **Stateless services** | No session state in services; all state in databases/Redis |
| **Horizontal scale** | `docker compose up --scale session-service=3`; Eureka auto-discovers |
| **Database constraints** | Prevents double-booking across concurrent instances |
| **Database-per-service** | No shared schemas; each service scales its DB independently |
| **Config hot-reload** | Spring Cloud Config Server backed by Git; no restarts needed |
| **Circuit breakers** | Resilience4j prevents cascade failures from slow downstream services |

---

## 11. Deployment Overview

### 11.1 Infrastructure
- **Cloud:** Azure VM (Ubuntu 22.04 LTS, 2+ vCPU, 8GB RAM, 50GB storage)
- **Containerization:** Docker (multi-stage builds) + Docker Compose (3 compose files)
- **SSL:** Let's Encrypt via Certbot; auto-renewed certificates
- **Registry:** Azure Container Registry (ACR) — stores all service images

### 11.2 Docker Compose Stack Breakdown
| File | Contents |
|------|----------|
| `docker-compose.infra.yml` | MySQL (10 DBs), Redis, RabbitMQ, Zipkin, Config Server, Eureka |
| `docker-compose.services.yml` | All 11 microservices |
| `docker-compose.monitoring.yml` | Prometheus, Grafana, Loki, Promtail |
| `frontend/docker-compose.yml` | Nginx + Angular SPA |

---

## 12. Assumptions & Constraints

| Category | Detail |
|----------|--------|
| **Messaging** | WebSocket-based real-time chat (Messaging Service) is in development; not yet production-ready |
| **Payment** | Only Razorpay (INR) is integrated; multi-currency support not implemented |
| **Database** | All services use a shared MySQL instance on the same VM; production would use separate managed instances |
| **Horizontal scaling** | Currently single-instance deployment; Eureka enables scaling but infra does not yet auto-scale |
| **Authentication** | Refresh tokens invalidated only on explicit logout; no device management |
| **Email** | SMTP credentials configured per environment; no email retry/dead-letter beyond RabbitMQ durable queues |
| **Admin capabilities** | Admin role cannot be self-assigned; must be set directly in the database |

---

## 13. Technology Stack Summary

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | 17 LTS | Core language |
| Spring Boot | 3.4.11 | Microservices framework |
| Spring Cloud | 2024.0.0 | Config, Discovery, Gateway |
| Spring Data JPA + Hibernate | — | ORM layer |
| Spring AMQP | — | RabbitMQ integration |
| Spring Data Redis | — | Caching |
| OpenFeign + Resilience4j | — | HTTP client + fault tolerance |
| Micrometer + Zipkin | — | Distributed tracing |
| Lombok | 1.18.40 | Boilerplate reduction |
| springdoc-openapi | 2.8.8 | Swagger UI / OpenAPI |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Angular | 18.0 | SPA framework |
| NgRx Signals | 18.0 | Signal-based state management |
| RxJS | 7.8 | Reactive programming |
| TypeScript | 5.4 | Type safety |
| Tailwind CSS | 3.3 | Utility-first styling |
| Angular Material | 18.0 | UI components |

### DevOps & Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker + Docker Compose | Containerization & orchestration |
| GitHub Actions | CI/CD pipeline |
| Azure VM (Ubuntu 22.04) | Production hosting |
| Azure Container Registry | Docker image registry |
| SonarCloud | Code quality analysis |
| Nginx | Reverse proxy + SSL |

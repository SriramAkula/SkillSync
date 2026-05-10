# SkillSync — Mentor-Learner Platform

[![Java](https://img.shields.io/badge/Java-17%20LTS-orange)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.11-brightgreen)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2024.0.0-brightgreen)](https://spring.io/projects/spring-cloud)
[![Angular](https://img.shields.io/badge/Angular-18.0-red)](https://angular.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://www.docker.com/)
[![SonarCloud](https://img.shields.io/badge/SonarCloud-Quality%20Gate-orange)](https://sonarcloud.io/)

A production-grade, cloud-native **microservices platform** connecting skilled mentors with learners. Built with Spring Boot 3.4.11, Angular 18, Docker, and deployed on Azure VM via GitHub Actions CI/CD.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#️-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Services](#-services)
- [Quick Start](#-quick-start)
- [Configuration](#️-configuration)
- [Database](#️-database)
- [API Documentation](#-api-documentation)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Observability](#-observability)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

SkillSync is a full-featured mentor-learner marketplace where:
- **Learners** discover mentors, book 1:1 sessions, join study groups, submit reviews, and process payments
- **Mentors** manage their profile, availability, and accept/reject session requests
- **Admins** oversee user management, mentor approvals, and system moderation

### Key Features

✅ JWT-based authentication with Google OAuth2 support  
✅ Role-based access control (Learner, Mentor, Admin) via header propagation  
✅ Full session booking lifecycle (Request → Accept/Reject → Cancel)  
✅ Double-booking prevention via DB UNIQUE constraints + application checks  
✅ Payment processing via Razorpay (Saga pattern with idempotency)  
✅ Event-driven notifications via RabbitMQ + SMTP email (Thymeleaf templates)  
✅ Distributed tracing (Zipkin), metrics (Prometheus/Grafana), log aggregation (Loki/Promtail)  
✅ CQRS pattern in Session and Mentor services  
✅ Redis caching for user/skill/session profiles  
✅ SonarCloud quality gates (>75% backend, >85% frontend coverage)  
⏳ Real-time WebSocket messaging (infrastructure ready, STOMP pending)  

---

## 🏗️ Architecture

### System Layers

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1: CLIENT                                                 │
│  Angular 18 SPA (NgRx Signal Store, Tailwind CSS, Karma/Jasmine) │
│  Served via Nginx (Docker, port 80/443)                          │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────────────┐
│  LAYER 2: EDGE                                                   │
│  Nginx Reverse Proxy (SSL Termination, WebSocket Upgrade)        │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│  LAYER 3: API GATEWAY (Port 9090)                                │
│  Spring Cloud Gateway + JwtAuthenticationFilter                  │
│  → Validates JWT, injects X-User-Id / roles headers              │
│  → Eureka load-balanced routing (lb://service-name)              │
└───────┬───────┬───────┬───────┬───────┬───────┬───────┬──────────┘
        │       │       │       │       │       │       │
┌───────▼───────▼───────▼───────▼───────▼───────▼───────▼──────────┐
│  LAYER 4: MICROSERVICES                                           │
│  Auth   User  Skill  Session  Mentor  Group  Review  Payment      │
│  8081   8082  8083   8084     8085    8086   8087    8089          │
│  + Notification (8088) + Messaging (8090 ⏳)                      │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│  LAYER 5: EVENT BUS                                              │
│  RabbitMQ (TOPIC Exchange: skillsync.*.exchange)                 │
│  Routing Keys: user.created, session.*, review.submitted         │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│  LAYER 6: DATA                                                   │
│  MySQL 8.0 (10 isolated DBs)  │  Redis 7 (Cache + Refresh Tokens)│
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│  LAYER 7: OBSERVABILITY                                          │
│  Prometheus → Grafana   │  Promtail → Loki   │  Zipkin           │
└──────────────────────────────────────────────────────────────────┘
```

### Service Communication

```
Synchronous (Feign Clients):
  Session  → User Service    (blocked-user check, participant details)
  Session  → Mentor Service  (validate mentor exists)
  Mentor   → User Service    (resolve user profile for mentor card)
  Notification → User/Mentor (fetch email/name for email dispatch)
  Payment  → Mentor Service  (fetch hourly rate)
  Payment  → Session Service (update session status to COMPLETED)

Asynchronous (RabbitMQ TOPIC Exchange):
  Auth     → user.created / user.updated    → User Service
  Session  → session.requested/accepted/    → Notification Service
             rejected/cancelled
  Review   → review.submitted               → Notification + Mentor Service
  Payment  → payment.completed              → (future consumers)
```

---

## 💻 Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | 17 LTS | Core language |
| Spring Boot | 3.4.11 | Microservices framework |
| Spring Cloud | 2024.0.0 | Config, Discovery, Gateway |
| Spring Data JPA | — | ORM (Hibernate) |
| Spring AMQP | — | RabbitMQ integration |
| Spring Data Redis | — | Caching (user/skill/session profiles) |
| OpenFeign + Resilience4j | — | HTTP client + circuit breaker |
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
| Karma + Jasmine | 6.4 / 5.1 | Unit testing |

### DevOps & Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker + Docker Compose | Containerization & orchestration |
| GitHub Actions | CI/CD pipeline (3-job: quality → build → deploy) |
| Azure VM (Ubuntu 22.04) | Production hosting (2+ vCPU, 8GB RAM) |
| Azure Container Registry | Docker image registry |
| SonarCloud | Code quality analysis |
| Nginx | Reverse proxy + SSL (Let's Encrypt) |

---

## 📁 Project Structure

```
SkillSync/
├── .github/
│   └── workflows/
│       └── main_ci_cd.yml           # GitHub Actions CI/CD (3-job pipeline)
│
├── backend/
│   ├── api-gateway/                 # Spring Cloud Gateway (port 9090)
│   ├── auth-service/                # JWT, OAuth2, OTP (port 8081)
│   ├── user-service/                # Profiles, block/unblock, MinIO (port 8082)
│   ├── skill-service/               # Skill catalog (port 8083)
│   ├── session-service/             # Booking lifecycle, CQRS (port 8084)
│   ├── mentor-service/              # Mentor profiles, approval, CQRS (port 8085)
│   ├── group-service/               # Study groups, membership (port 8086)
│   ├── review-service/              # Ratings, reviews (port 8087)
│   ├── notification-service/        # Email notifications, RabbitMQ consumer (port 8088)
│   ├── payment-gateway/             # Razorpay, Saga pattern (port 8089)
│   ├── messaging-service/           # REST messaging API ⏳ WebSocket pending (port 8090)
│   ├── config-server/               # Spring Cloud Config (port 8888)
│   ├── eureka-server/               # Service discovery (port 8761)
│   ├── config-repo/                 # Git-backed property files (one per service)
│   ├── grafana/                     # Grafana dashboard JSON files
│   ├── docker-compose.infra.yml     # MySQL (10 DBs), Redis, RabbitMQ, Zipkin, Config, Eureka
│   ├── docker-compose.services.yml  # All 11 microservices
│   ├── docker-compose.monitoring.yml# Prometheus, Grafana, Loki, Promtail
│   ├── docker-compose.sonarqube.yml # Local SonarQube instance
│   ├── prometheus.yml               # Prometheus scrape config
│   ├── loki-config.yml              # Loki storage config
│   ├── promtail-config.yml          # Log shipping config
│   └── pom.xml                      # Root Maven POM (parent aggregator)
│
├── frontend/                        # Angular 18 SPA
│   ├── src/app/
│   │   ├── core/                    # Guards, interceptors, services, NgRx stores
│   │   ├── features/                # Lazy-loaded feature modules (12 features)
│   │   ├── layout/                  # Shell, Navbar, Sidebar, ThemeToggle
│   │   └── shared/                  # Pagination, Toast, models
│   ├── Dockerfile                   # Multi-stage: Node build → Nginx serve
│   ├── docker-compose.yml           # Frontend container
│   ├── nginx.conf                   # SPA routing + API proxy
│   ├── proxy.conf.json              # Dev proxy → localhost:9090
│   └── sonar-project.properties     # SonarCloud config
│
├── docs/                            # Technical documentation suite
│   ├── 1_Use_Case_Analysis.md
│   ├── 2_High_Level_Design.md
│   ├── 3_Architecture_Diagram.md
│   ├── 4_Low_Level_Design.md
│   ├── 5_Database_Design.md
│   └── 6_Technical_Documentation.md
│
├── understanding/                   # Developer reference docs
│   ├── HLD.md                       # High Level Design
│   ├── LLD.md                       # Low Level Design
│   └── DEPLOYMENT_ARCHITECTURE.md
│
└── README.md                        # This file
```

---

## 🔧 Services

### Microservices

| Service | Port | Database | Key Features |
|---------|------|----------|-------------|
| **API Gateway** | 9090 | — | JWT validation, header injection, Eureka routing |
| **Auth Service** | 8081 | `skill_auth` | JWT (HS256), Google OAuth2, OTP, BCrypt, RabbitMQ publisher |
| **User Service** | 8082 | `skill_user` | Profile CRUD, Redis cache (10-min), admin block/unblock, MinIO |
| **Skill Service** | 8083 | `skill_skill` | Skill catalog, search, Redis caching |
| **Session Service** | 8084 | `skill_session` | CQRS, booking lifecycle, DB conflict prevention, event publishing |
| **Mentor Service** | 8085 | `skill_mentor` | CQRS, approval workflow, availability, rating update |
| **Group Service** | 8086 | `skill_group` | Study groups, unique membership constraint |
| **Review Service** | 8087 | `skill_review` | 1–5 star ratings, anonymous reviews, event publishing |
| **Notification Service** | 8088 | `skill_notification` | RabbitMQ consumer, Thymeleaf email templates, SMTP |
| **Payment Gateway** | 8089 | `skill_payment` | Razorpay, Saga pattern, HMAC-SHA256 webhook verification |
| **Messaging Service** | 8090 | `skill_messaging` | REST messaging API ⏳ WebSocket/STOMP pending |
| **Config Server** | 8888 | Git repo | Centralized config (one properties file per service) |
| **Eureka Server** | 8761 | In-memory | Service discovery + health tracking |

### Infrastructure

| Service | Port | Purpose |
|---------|------|---------|
| **MySQL** | 3306 | Primary data store (10 isolated databases) |
| **Redis** | 6379 | Profile caching + refresh token storage |
| **RabbitMQ** | 5672 / 15672 | Async messaging event bus |
| **Zipkin** | 9411 | Distributed request tracing |
| **Prometheus** | — | Metrics scraping from `/actuator/prometheus` |
| **Grafana** | 3000 | Metrics dashboards |
| **Loki** | 3100 | Log storage |
| **Promtail** | — | Docker log shipping → Loki |

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (Docker Desktop on Windows)
- **Java 17+** (for local service runs)
- **Node.js 18+** (for frontend dev)
- **Maven 3.8+**

### Option 1: Full Docker Stack (Recommended)

```bash
# 1. Start infrastructure (MySQL, Redis, RabbitMQ, Zipkin, Config, Eureka)
cd backend
docker compose -f docker-compose.infra.yml up -d

# 2. Wait for infra healthchecks, then start all microservices
docker compose -f docker-compose.services.yml up -d

# 3. Start monitoring (optional)
docker compose -f docker-compose.monitoring.yml up -d

# 4. Start frontend
cd ../frontend
docker compose up -d

# 5. Verify
docker ps
```

**Access Points:**
- Frontend: `http://localhost` (port 80)
- API Gateway: `http://localhost:9090`
- Eureka: `http://localhost:8761`
- Grafana: `http://localhost:3000` (admin/admin)
- Zipkin: `http://localhost:9411`
- RabbitMQ: `http://localhost:15672` (admin/admin)

### Option 2: Local Development

```bash
# 1. Start only infrastructure
cd backend
docker compose -f docker-compose.infra.yml up -d

# 2. Start backend services (in order)
cd config-server && mvn spring-boot:run   # Wait for ready
cd eureka-server && mvn spring-boot:run   # Wait for ready
cd auth-service && mvn spring-boot:run
# ... etc

# 3. Start frontend dev server
cd frontend
npm install
npm start    # http://localhost:4200 (proxied to :9090)
```

---

## ⚙️ Configuration

All configuration is managed via **Spring Cloud Config Server** backed by `config-repo/`.

### Environment Variables (backend/.env)

```bash
# Database
MYSQL_ROOT_PASSWORD=<password>
MYSQL_USER=skillsync
MYSQL_PASSWORD=<password>

# Redis
REDIS_PASSWORD=<password>

# RabbitMQ
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=<password>

# JWT
JWT_SECRET=<HS256-min-256-bit-key>
JWT_EXPIRY=3600000       # 1 hour in milliseconds

# Google OAuth2
GOOGLE_CLIENT_ID=<your-google-client-id>

# SMTP
SPRING_MAIL_USERNAME=<email@gmail.com>
SPRING_MAIL_PASSWORD=<app-password>

# Razorpay
RAZORPAY_KEY_ID=<key-id>
RAZORPAY_KEY_SECRET=<key-secret>

# Azure Container Registry
ACR_LOGIN_SERVER=<registry>.azurecr.io
```

---

## 🗄️ Database

Each service has a dedicated MySQL database (no shared schemas):

| Database | Service |
|----------|---------|
| `skill_auth` | Auth Service |
| `skill_user` | User Service |
| `skill_skill` | Skill Service |
| `skill_session` | Session Service |
| `skill_mentor` | Mentor Service |
| `skill_group` | Group Service |
| `skill_review` | Review Service |
| `skill_notification` | Notification Service |
| `skill_payment` | Payment Gateway |
| `skill_messaging` | Messaging Service |

### Key Constraints

```sql
-- Session double-booking prevention
ALTER TABLE sessions
ADD UNIQUE KEY unique_booking (mentor_id, scheduled_at);

-- Group membership uniqueness
ALTER TABLE group_members
ADD UNIQUE KEY uk_group_user (group_id, user_id);

-- Payment idempotency
ALTER TABLE payment_sagas
ADD UNIQUE KEY uk_session (session_id),
ADD UNIQUE KEY uk_correlation (correlation_id);
```

---

## 📚 API Documentation

Swagger UI is available on every service:

```
Auth Service:         http://localhost:8081/swagger-ui.html
User Service:         http://localhost:8082/swagger-ui.html
Skill Service:        http://localhost:8083/swagger-ui.html
Session Service:      http://localhost:8084/swagger-ui.html
Mentor Service:       http://localhost:8085/swagger-ui.html
Group Service:        http://localhost:8086/swagger-ui.html
Review Service:       http://localhost:8087/swagger-ui.html
Notification Service: http://localhost:8088/swagger-ui.html
Payment Gateway:      http://localhost:8089/swagger-ui.html
```

> **Note:** The API Gateway JWT filter blocks some paths. Use direct service URLs for dev testing.

### Key API Endpoints

```
# Auth
POST /api/auth/register          → Register + OTP
POST /api/auth/login             → Email/password → JWT
POST /api/auth/oauth/google      → Google ID Token → JWT
POST /api/auth/refresh           → Rotate JWT (refresh token cookie)

# Sessions
POST /api/session                → Book session (Learner)
GET  /api/session/{id}           → Session details
PUT  /api/session/{id}/accept    → Accept (Mentor)
PUT  /api/session/{id}/reject    → Reject with reason (Mentor)
PUT  /api/session/{id}/cancel    → Cancel

# Mentors
GET  /api/mentor/approved        → Browse mentors (paginated)
GET  /api/mentor/search          → Filter by skill/rate/rating
POST /api/mentor/apply           → Apply to become mentor
PUT  /api/mentor/{id}/approve    → Admin approve

# Payments
POST /api/payment/create-order   → Razorpay order
POST /api/payment/verify         → Verify HMAC signature
POST /api/payment/payments       → Razorpay webhook (public)
```

---

## 🔁 CI/CD Pipeline

SkillSync uses **GitHub Actions** with a 3-job pipeline:

```
Push to main/development/feature/*
        │
        ├── Job 1a: backend-quality
        │   └── mvn clean verify + SonarCloud analysis
        │
        ├── Job 1b: frontend-quality
        │   └── npm ci + npm run lint
        │
        ├── Job 2: build-and-push (matrix: 14 services)
        │   └── docker build → push :latest + :sha to ACR
        │
        └── Job 3: deploy
            └── SSH to Azure VM
                → git pull
                → docker compose down → pull → up --force-recreate
                → Post-deploy: docker ps + disk prune
```

**Manual Trigger:** Force rebuild all service images available via GitHub Actions UI.

---

## 📊 Observability

| Tool | Access | Purpose |
|------|--------|---------|
| **Grafana** | `http://localhost:3000` | JVM, HTTP, business metrics dashboards |
| **Zipkin** | `http://localhost:9411` | Distributed request tracing |
| **Prometheus** | Internal | Scrapes `/actuator/prometheus` every 15s |
| **Loki** | Via Grafana Explore | Centralized log search |

```bash
# View logs in Grafana
# Explore → Loki → {container="session-service"} |= "ERROR"

# Health check all services
for port in 8081 8082 8083 8084 8085 8086 8087 8088 8089 9090 8761 8888; do
  echo "Port $port: $(curl -s http://localhost:$port/actuator/health | python -c 'import sys,json; print(json.load(sys.stdin)["status"])')"
done
```

---

## 👨‍💻 Development

### Testing

```bash
# Backend (per service)
cd backend/auth-service
mvn clean verify       # runs tests + generates JaCoCo coverage report

# Frontend
cd frontend
npm test -- --code-coverage --watch=false   # Coverage target: >85%
npm run lint                                # Zero errors required for CI
```

### Code Quality Gates (SonarCloud)
- **Backend**: > 75% line coverage
- **Frontend**: > 85% line coverage
- **Linting**: Zero ESLint errors

---

## 🚢 Deployment

### Azure VM Setup

```bash
# SSH to VM
ssh azureuser@<vm-ip>

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker

# Clone repo
git clone https://github.com/SriramAkula/SkillSync.git
cd SkillSync

# Configure environment
cp backend/.env.example backend/.env
nano backend/.env    # Fill in all secrets

# SSL Certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com

# Deploy
cd backend
docker compose -f docker-compose.infra.yml up -d
docker compose -f docker-compose.services.yml up -d
docker compose -f docker-compose.monitoring.yml up -d
cd ../frontend && docker compose up -d
```

---

## 🐛 Troubleshooting

### Service not registered in Eureka
```bash
# Check Eureka registrations
curl http://localhost:8761/eureka/apps | grep "<app>"
# Verify service is up
docker logs -f <service-name>
```

### Database connection issues
```bash
# Verify MySQL is healthy
docker inspect skill-mysql | grep Status
# Check DB exists
docker exec skill-mysql mysql -u root -p<password> -e "SHOW DATABASES;"
```

### Container out of memory
```bash
docker stats   # Check memory usage
# Add mem_limit: 2g under service in docker-compose.services.yml
```

### RabbitMQ queue issues
```bash
# Access management UI
http://localhost:15672  # guest/guest
# Check queue bindings and message counts
```

---

## 📄 Documentation

| Document | Location |
|----------|----------|
| Use Case Analysis | [docs/1_Use_Case_Analysis.md](docs/1_Use_Case_Analysis.md) |
| High Level Design | [docs/2_High_Level_Design.md](docs/2_High_Level_Design.md) |
| Architecture Diagrams | [docs/3_Architecture_Diagram.md](docs/3_Architecture_Diagram.md) |
| Low Level Design | [docs/4_Low_Level_Design.md](docs/4_Low_Level_Design.md) |
| Database Design | [docs/5_Database_Design.md](docs/5_Database_Design.md) |
| Technical Documentation | [docs/6_Technical_Documentation.md](docs/6_Technical_Documentation.md) |

---

**Last Updated:** May 2026  
⚡ **Status:** Production Ready (Messaging WebSocket in progress)

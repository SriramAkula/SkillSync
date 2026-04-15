# SkillSync - Mentor-Learner Platform

[![Java](https://img.shields.io/badge/Java-17%2B-orange)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.11-brightgreen)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-18.0-red)](https://angular.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A comprehensive microservices-based platform connecting skilled mentors with eager learners. Built with Spring Boot, Angular, and modern cloud-native technologies.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Services](#services)
- [Configuration](#configuration)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

SkillSync is a feature-rich platform where:
- **Learners** discover mentors, book sessions, submit reviews, and connect with peers
- **Mentors** manage availability, accept/reject sessions, and view ratings
- **Admins** oversee system health, user management, and content moderation

### Key Features
✅ Real-time messaging via WebSocket (STOMP + RabbitMQ) (Websockets under progress)
✅ Secure JWT-based authentication with OAuth2 support
✅ Role-based access control (Learner, Mentor, Admin)
✅ Distributed session management with Redis locks
✅ Payment processing via Razorpay
✅ Comprehensive monitoring (Prometheus, Grafana, Zipkin)
✅ Scalable microservices architecture
✅ Docker containerization for easy deployment

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Angular 18)                   │
│              (Docker: nginx + Angular app)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WSS
┌─────────────────────────▼────────────────────────────────────┐
│                   API Gateway (Gateway)                      │
│        (Spring Cloud Gateway + OAuth2 + WebSocket)           │
│                    Port: 9090                                │
└──────────┬──────────────────────────────────────────┬────────┘
           │ HTTP Routes                 │ WebSocket Routes
      ┌────▼─────────────────────┐   ┌──▼──────────────────────┐
      │   13 Microservices       │   │  Messaging Service      │
      │  RabbitMQ Event Bus      │   │  (STOMP + RabbitMQ)     │
      │  Eureka Discovery        │   │  ⏳ Under Progress      │
      │  Config Server           │   │                         │
      └────────────────────────┬─┘   └──────────────────────────┘
           │                   │
    ┌──────▼──────────────────▼──────────┐
    │    Shared Infrastructure           │
    │  ┌─ MySQL (12 databases)          │
    │  ┌─ Redis (Locks, Cache)          │
    │  ┌─ RabbitMQ (Event Bus)          │
    │  ┌─ Zipkin (Distributed Tracing)  │
    │  ┌─ Prometheus + Grafana (Monitor) │
    └─────────────────────────────────────┘
```

### Service Communication Pattern

```
Synchronous: Feign Clients (Service-to-Service)
    ↓
Service A → Feign Client → HTTP → Service B

Asynchronous: Event-Driven (RabbitMQ TOPIC)
    ↓
Event Publisher → RabbitMQ TOPIC → Multiple Subscribers
```

---

## 💻 Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Spring Boot | 3.4.11 | Microservices framework |
| Java | 17 LTS | Core language |
| Spring Cloud | 2023.0.0 | Service discovery, config, gateway |
| Spring Data JPA | - | Database ORM |
| RabbitMQ | 3.12 | Async messaging |
| Redis | 7.0+ | Caching & distributed locks |
| MySQL | 8.0 | Persistent storage |
| Feign | - | Declarative HTTP client |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Angular | 18.0 | SPA framework |
| NgRx Signals | 18.0 | State management |
| RxJS | 7.8 | Reactive programming |
| TypeScript | 5.4 | Type-safe JavaScript |
| Tailwind CSS | 3.3 | Utility-first CSS |
| Angular Material | 18.0 | UI components |

### DevOps & Monitoring
| Technology | Version | Purpose |
|-----------|---------|---------|
| Docker | Latest | Containerization |
| Docker Compose | 2.x+ | Container orchestration |
| Prometheus | Latest | Metrics collection |
| Grafana | 10.x+ | Visualization |
| Zipkin | 2.x | Distributed tracing |
| SonarQube | 9.x+ | Code quality analysis |

---

## 📦 Prerequisites

### Local Development
- **Java JDK 17+**
  ```bash
  # Verify
  java -version
  ```
- **Docker & Docker Compose**
  ```bash
  docker --version
  docker compose --version
  ```
- **Node.js 18+** (for frontend)
  ```bash
  node --version
  npm --version
  ```
- **Maven 3.8+** (for building backend)
  ```bash
  mvn --version
  ```

### Azure VM Deployment
- **Azure VM** with Ubuntu 22.04 LTS
- **2+ vCPU, 8GB RAM minimum**
- **50GB+ storage**
- **Port access**: 80, 443, 9090, 61613

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Navigate to project root
cd ~/SkillSync

# Start all services (backend infrastructure)
cd backend
docker compose -f docker-compose.services.yml \
               -f docker-compose.infra.yml \
               -f docker-compose.monitoring.yml up -d

# Start frontend
cd ../frontend
docker compose up -d

# Verify all containers
docker ps
```

**Expected Containers:**
- ✅ api-gateway (9090)
- ✅ auth-service (8081)
- ✅ user-service (8082)
- ✅ skill-service (8083)
- ✅ session-service (8084)
- ✅ mentor-service (8085)
- ✅ group-service (8086)
- ✅ review-service (8087)
- ✅ notification-service (8088)
- ✅ payment-gateway (8089)
- ✅ config-server (8888)
- ✅ eureka-server (8761)
- ⏳ messaging-service (8090) - Under Progress
- ✅ MySQL, Redis, RabbitMQ, Prometheus, Grafana, Zipkin
- ✅ skillsync-frontend (nginx, Angular)

### Option 2: Local Development

#### Backend Setup
```bash
cd backend

# Start infrastructure only (MySQL, Redis, RabbitMQ, etc.)
docker compose -f docker-compose.infra.yml up -d

# Build all services
mvn clean install

# Start config server (dependency for others)
cd config-server
mvn spring-boot:run

# In separate terminals, start each service
cd ../eureka-server && mvn spring-boot:run
cd ../api-gateway && mvn spring-boot:run
cd ../auth-service && mvn spring-boot:run
# ... etc
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 4200)
npm start

# Open browser
# http://localhost:4200
```

---

## 📁 Project Structure

```
SkillSync/
├── backend/                          # Backend microservices
│   ├── api-gateway/                  # Spring Cloud Gateway (9090)
│   ├── config-server/                # Centralized config (8888)
│   ├── eureka-server/                # Service discovery (8761)
│   ├── config-repo/                  # Configuration files
│   ├── auth-service/                 # Authentication (8081)
│   ├── user-service/                 # User management (8082)
│   ├── skill-service/                # Skills catalog (8083)
│   ├── session-service/              # Session booking (8084)
│   ├── mentor-service/               # Mentor profiles (8085)
│   ├── group-service/                # Study groups (8086)
│   ├── review-service/               # Reviews & ratings (8087)
│   ├── notification-service/         # Email notifications (8088)
│   ├── payment-gateway/              # Payment processing (8089)
│   ├── messaging-service/            # Real-time chat (8090) ⏳
│   │
│   ├── docker-compose.services.yml   # All microservices
│   ├── docker-compose.infra.yml      # Infrastructure (MySQL, Redis, RabbitMQ)
│   ├── docker-compose.monitoring.yml # Monitoring stack
│   ├── docker-compose.sonarqube.yml  # Code quality
│   │
│   ├── logstash.conf                 # Log aggregation
│   ├── loki-config.yml               # Log storage
│   ├── prometheus.yml                # Metrics collection
│   ├── promtail-config.yml           # Log shipping
│   └── pom.xml                       # Root pom (parent)
│
├── frontend/                         # Angular 18 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                 # Services, stores, auth
│   │   │   │   ├── auth/             # Authentication logic
│   │   │   │   ├── services/         # API integration
│   │   │   │   └── stores/           # NgRx Signal stores
│   │   │   ├── features/             # Feature modules
│   │   │   │   ├── learn/            # Learner pages
│   │   │   │   ├── mentors/          # Mentor browsing
│   │   │   │   ├── sessions/         # Session management
│   │   │   │   ├── groups/           # Study groups
│   │   │   │   ├── messaging/        # Real-time chat ⏳
│   │   │   │   ├── reviews/          # Ratings & reviews
│   │   │   │   ├── payments/         # Payment flow
│   │   │   │   └── admin/            # Admin dashboard
│   │   │   ├── shared/               # Shared components
│   │   │   └── app.component.ts      # Root component
│   │   ├── assets/                   # Static files
│   │   ├── styles/                   # Global styles
│   │   └── index.html
│   │
│   ├── nginx.conf                    # Reverse proxy config
│   ├── docker-compose.yml            # Frontend container
│   ├── Dockerfile                    # Angular app + Nginx
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
│
├── docker-compose.yml                # Root orchestration (all stacks)
├── ARCHITECTURE_AND_DEPLOYMENT_GUIDE.md
├── PRE_DEPLOYMENT_VALIDATION_COMPLETE.md
├── ADMIN_IMPLEMENTATION_SUMMARY.md
├── ADMIN_PANEL_IMPLEMENTATION_PLAN.md
└── README.md                         # This file
```

---

## 🔧 Services

### Microservices Overview

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| **API Gateway** | 9090 | - | Request routing, OAuth2 |
| **Auth Service** | 8081 | skill_auth | JWT generation, Google OAuth |
| **User Service** | 8082 | skill_user | User profiles, verification |
| **Skill Service** | 8083 | skill_skill | Skill catalog, search |
| **Session Service** | 8084 | skill_session | Session booking, scheduling |
| **Mentor Service** | 8085 | skill_mentor | Mentor profiles, availability |
| **Group Service** | 8086 | skill_group | Study group management |
| **Review Service** | 8087 | skill_review | Ratings, reviews, feedback |
| **Notification Service** | 8088 | skill_notification | Email notifications |
| **Payment Gateway** | 8089 | skill_payment | Razorpay integration |
| **Messaging Service** | 8090 | - | WebSocket chat ⏳ |
| **Config Server** | 8888 | - | Centralized configuration |
| **Eureka Server** | 8761 | - | Service discovery |

### Infrastructure Services

| Service | Port | Purpose |
|---------|------|---------|
| **MySQL** | 3306 | Primary data store (12 databases) |
| **Redis** | 6379 | Caching, distributed locks |
| **RabbitMQ** | 5672, 15672 | Async messaging, event bus |
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3000 | Dashboard visualization |
| **Zipkin** | 9411 | Distributed tracing |
| **Logstash** | 5000 | Log aggregation |
| **Loki** | 3100 | Log storage |
| **SonarQube** | 9000 | Code quality analysis |

### Messaging Service Status ⏳

The Messaging Service (real-time WebSocket chat) is currently under development:
- ✅ API Gateway routes configured
- ✅ Nginx WebSocket upgrade configuration ready
- ⏳ STOMP protocol implementation in progress
- ⏳ RabbitMQ event subscription pending
- 🔄 Frontend chat UI being integrated

---


### Service-Specific Configuration

Centralized in Git repo (fetched by Config Server):
- `config-repo/auth-service.properties`
- `config-repo/user-service.properties`
- `config-repo/api-gateway.properties`
- ... etc

---

## 🗄️ Database

### Database-Per-Service Pattern

Each microservice has dedicated MySQL database:

```
skill_auth          → Auth Service
skill_user          → User Service
skill_skill         → Skill Service
skill_session       → Session Service (Double-booking prevention)
skill_mentor        → Mentor Service
skill_group         → Group Service
skill_review        → Review Service
skill_notification  → Notification Service
skill_payment       → Payment Service
zipkin              → Distributed Tracing
```

### Key Constraints

#### Session Table (Double-Booking Prevention)
```sql
CREATE UNIQUE INDEX unique_session_booking 
ON session (mentor_id, scheduled_at) 
WHERE status IN ('REQUESTED', 'ACCEPTED');
```

#### Lock Mechanism (Redis + DB)
1. Redis SET NX EX: `session-lock:{mentorId}:{scheduledAt}` (30s TTL)
2. DB UNIQUE constraint as backup
3. Application-level validation

---

## 📚 API Documentation

### Swagger/OpenAPI

Access API docs from each service:

```
Auth Service:        http://localhost:8081/swagger-ui.html
User Service:        http://localhost:8082/swagger-ui.html
Skill Service:       http://localhost:8083/swagger-ui.html
Session Service:     http://localhost:8084/swagger-ui.html
Mentor Service:      http://localhost:8085/swagger-ui.html
API Gateway:         http://localhost:9090/swagger-ui.html
```

Due to API Gateway authentication filter, some paths require direct service access.

### Common Endpoints

#### Authentication
```
POST   /api/auth/login              → Login with email/password
POST   /api/auth/oauth2/google      → Google OAuth login
POST   /api/auth/register           → User registration
POST   /api/auth/refresh-token      → Refresh JWT
```

#### Mentors
```
GET    /api/mentors                 → Browse approved mentors
GET    /api/mentors/{id}            → Mentor details
GET    /api/mentors/my-profile      → Logged-in mentor profile
POST   /api/mentors/apply           → Apply to become mentor
PUT    /api/mentors/{id}            → Update profile
```

#### Sessions
```
POST   /api/sessions                → Book a session
GET    /api/sessions/history        → Session history
PUT    /api/sessions/{id}/accept    → Accept session request
PUT    /api/sessions/{id}/reject    → Reject session request
```

#### Messaging (WebSocket) ⏳
```
WS     /ws-messaging               → Connect to chat
STOMP   /user/queue/messages        → Subscribe to personal messages
STOMP   /topic/session/{id}         → Subscribe to session chat
```

---

## 👨‍💻 Development

### Code Quality

```bash
# Frontend Linting
cd frontend
npm run lint

# Backend SonarQube Analysis
cd backend
docker compose -f docker-compose.sonarqube.yml up -d
mvn clean sonar:sonar

# Access SonarQube
# http://localhost:9000 (admin/admin)
```

### Testing

```bash
# Frontend Unit Tests
cd frontend
npm run test

# Frontend E2E Tests
npm run e2e

# Backend Unit Tests
cd backend/auth-service
mvn test

# Backend Integration Tests
mvn verify
```

### Common Development Commands

```bash
# Check service health
curl http://localhost:8081/health

# View Eureka dashboard
http://localhost:8761

# Monitor Prometheus metrics
http://localhost:9090

# View Grafana dashboards
http://localhost:3000 (admin/admin)

# View distributed traces
http://localhost:9411

# Access RabbitMQ management
http://localhost:15672 (guest/guest)
```

---

## 🚢 Deployment

### Azure VM Deployment

#### 1. Prerequisites on VM
```bash
# SSH to VM
ssh azureuser@<vm-ip>

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker compose --version
```

#### 2. Clone Repository
```bash
cd ~
git clone https://github.com/your-org/SkillSync.git
cd SkillSync
```

#### 3. Configure Environment
```bash
# Copy .env template
cp backend/.env.example backend/.env

# Edit with your values
nano backend/.env

# Do the same for frontend
cp frontend/.env.example frontend/.env
```

#### 4. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d skillsync.me

# Copy to project
sudo cp /etc/letsencrypt/live/skillsync.me/fullchain.pem ./certs/
sudo cp /etc/letsencrypt/live/skillsync.me/privkey.pem ./certs/
sudo chown $USER:$USER ./certs/*
```

#### 5. Start Services
```bash
# Backend infrastructure
cd backend
docker compose -f docker-compose.infra.yml \
               -f docker-compose.services.yml \
               -f docker-compose.monitoring.yml up -d

# Frontend
cd ../frontend
docker compose up -d

# Verify
docker ps
```

#### 6. Configure Nginx (Reverse Proxy)
```bash
# Update frontend/nginx.conf with domain
# Copy to system
sudo cp frontend/nginx.conf /etc/nginx/sites-available/skillsync

# Enable site
sudo ln -s /etc/nginx/sites-available/skillsync /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

#### 7. Monitor Deployment
```bash
# Check logs
docker logs -f api-gateway
docker logs -f skillsync-frontend

# View metrics
curl http://localhost:9090/metrics

# Access Grafana
# http://<vm-ip>:3000
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Issue: "Container name already in use"
```bash
# Solution: Force remove existing container
docker container rm -f skillsync-frontend
docker compose up -d
```

#### Issue: "Cannot connect to docker daemon"
```bash
# Solution: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
docker ps
```

#### Issue: "WebSocket connection failed"
**Checklist:**
- ✅ Nginx has WebSocket upgrade headers
- ✅ API Gateway has `/ws-messaging` route
- ✅ Messaging service is running
- ✅ Firewall allows port 443
- ✅ Using `wss://` for HTTPS, `ws://` for HTTP

```bash
# Verify connection
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://skillsync.me/ws-messaging
```

#### Issue: "Service not discovered (Eureka)"
```bash
# Check Eureka status
curl http://localhost:8761/eureka/apps

# Verify service registration
curl http://localhost:8761/eureka/apps/auth-service
```

#### Issue: "Database migration failed"
```bash
# Check migrations
docker exec skill-mysql mysql -u root -p1234 skill_auth \
  -e "SELECT * FROM flyway_schema_history;"

# Rollback if needed
docker exec skill-mysql mysql -u root -p1234 skill_auth \
  -e "DELETE FROM flyway_schema_history WHERE version > 1;"
```

#### Issue: "Out of memory in containers"
```bash
# Increase Docker memory limit
# Edit docker-compose.yml
# Add under service: mem_limit: 2g

# Rebuild
docker compose down
docker compose up -d --build
```

### Logging

```bash
# All service logs
docker compose logs -f

# Specific service
docker compose logs -f api-gateway

# View in Grafana Loki
# http://localhost:3000 → Explore → Loki
```

### Health Checks

```bash
# Check all services status
for port in 8081 8082 8083 8084 8085 8086 8087 8088 8089 9090 8761 8888; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq '.status'
done
```

---

## 📝 Contributing

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   git checkout -b bugfix/issue-name
   ```

2. **Make changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation

3. **Code Quality Checks**
   ```bash
   # Backend
   cd backend
   mvn clean verify
   
   # Frontend
   cd frontend
   npm run lint
   npm run test
   ```

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: Add new feature description"
   git push origin feature/new-feature
   ```

5. **Create Pull Request**
   - Link to GitHub issue
   - Describe changes & testing
   - Request review from maintainers

### Code Style Guidelines

**Backend (Java):**
- Follow Google Java Style Guide
- Use meaningful variable names
- Add JavaDoc to public methods
- Write unit tests (minimum 75% coverage)

**Frontend (TypeScript):**
- Use strict mode
- Follow Angular style guide
- Use OnPush change detection
- Document complex business logic

---

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/your-org/SkillSync/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/SkillSync/discussions)
- **Email:** support@skillsync.me

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Spring Boot & Spring Cloud team
- Angular & NgRx community
- RabbitMQ & Docker communities
- All contributors and maintainers

---

**Last Updated:** April 13, 2026

⚡ **Status:** Production Ready (Messaging Service in progress)

For detailed architecture and deployment procedures, see [ARCHITECTURE_AND_DEPLOYMENT_GUIDE.md](ARCHITECTURE_AND_DEPLOYMENT_GUIDE.md)


<!-- Pipeline Trigger: Username uniqueness and API standardization -->


---

## 🚜 CI/CD Pipeline

SkillSync uses **GitHub Actions** for automated building, testing, and deployment to the Azure VM.

### Automated Triggers
- **Push to main/development**: Triggers a partial build (only changed services) and auto-deploys to the VM.
- **Path Filters**: To optimize speed, the pipeline only rebuilds services where files in backend/<service>/** or frontend/** have changed.

### Manual Trigger (Full Environment Sync)
If you need to force a full project rebuild (e.g., after base image updates or to resolve stale networking), you can use the **Manual Trigger**:

1. Go to the **Actions** tab in your GitHub repository.
2. Select the **SkillSync CI/CD Pipeline** workflow on the left.
3. Click the **Run workflow** dropdown button.
4. Check the **Force rebuild all service images** box.
5. Click **Run workflow**.


> [!IMPORTANT]
> **Force Rebuild** will perform several aggressive actions on the VM:
> - Rebuilds **all 14+ Docker images** regardless of branch changes.
> - Runs **docker compose up -d --force-recreate** for every service.
> - Performs **Aggressive Storage Cleanup** (reclaiming disk space by pruning all unused images and vacuuming logs).

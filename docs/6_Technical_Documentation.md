# SkillSync — Technical Documentation

> **Version:** 1.0 | **Date:** May 2026 | **Audience:** Engineering Teams, DevOps, Technical Reviewers

---

## 1. Repository Structure

```
SkillSync/
│
├── .github/
│   └── workflows/
│       └── main_ci_cd.yml           # GitHub Actions CI/CD pipeline (3 jobs)
│
├── backend/                         # All backend microservices
│   ├── api-gateway/                 # Spring Cloud Gateway (port 9090)
│   ├── auth-service/                # JWT + OAuth2 + OTP (port 8081)
│   ├── user-service/                # User profiles + admin controls (port 8082)
│   ├── skill-service/               # Skill catalog (port 8083)
│   ├── session-service/             # Booking + CQRS (port 8084)
│   ├── mentor-service/              # Mentor profiles + approval (port 8085)
│   ├── group-service/               # Study groups (port 8086)
│   ├── review-service/              # Ratings and reviews (port 8087)
│   ├── notification-service/        # Email + RabbitMQ consumer (port 8088)
│   ├── payment-gateway/             # Razorpay + Saga pattern (port 8089)
│   ├── messaging-service/           # WebSocket chat ⏳ (port 8090)
│   ├── eureka-server/               # Service discovery (port 8761)
│   ├── config-server/               # Centralized config (port 8888)
│   ├── config-repo/                 # Git-backed property files
│   │   ├── auth-service.properties
│   │   ├── user-service.properties
│   │   ├── api-gateway.properties
│   │   └── ... (one per service)
│   │
│   ├── grafana/                     # Grafana dashboard JSON files
│   ├── docker-compose.infra.yml     # MySQL, Redis, RabbitMQ, Zipkin, Eureka, Config
│   ├── docker-compose.services.yml  # All 11 microservices
│   ├── docker-compose.monitoring.yml# Prometheus, Grafana, Loki, Promtail
│   ├── docker-compose.sonarqube.yml # SonarQube local instance
│   ├── prometheus.yml               # Prometheus scrape config
│   ├── loki-config.yml              # Loki storage config
│   ├── promtail-config.yml          # Log shipping config
│   ├── logstash.conf                # (Legacy) Log aggregation config
│   └── pom.xml                      # Root Maven POM (parent aggregator)
│
├── frontend/
│   ├── src/
│   │   ├── app/                     # Angular application source
│   │   ├── assets/                  # Static assets (icons, images)
│   │   └── styles/                  # Global CSS / Tailwind config
│   ├── angular.json                 # Angular CLI workspace config
│   ├── package.json                 # npm dependencies
│   ├── tsconfig.json                # TypeScript compiler config
│   ├── karma.conf.js                # Test runner config
│   ├── eslint.config.js             # ESLint rules (strict TypeScript)
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── nginx.conf                   # Nginx config for SPA serving
│   ├── Dockerfile                   # Multi-stage: Node build → Nginx serve
│   ├── docker-compose.yml           # Frontend Docker Compose
│   └── sonar-project.properties     # SonarCloud frontend config
│
├── understanding/                   # Architecture documentation
│   ├── HLD.md                       # High Level Design
│   ├── LLD.md                       # Low Level Design
│   ├── DEPLOYMENT_ARCHITECTURE.md   # CI/CD and deployment details
│   ├── FRONTEND_ARCHITECTURE.md     # Frontend design notes
│   ├── project_mastery_guide.md     # Developer onboarding guide
│   ├── annotations_reference.md     # Spring annotation reference
│   └── docs/
│       └── SkillSync_Complete_CaseStudy.pdf
│
├── docs/                            # Generated technical documentation (this suite)
│   ├── 1_Use_Case_Analysis.md
│   ├── 2_High_Level_Design.md
│   ├── 3_Architecture_Diagram.md
│   ├── 4_Low_Level_Design.md
│   ├── 5_Database_Design.md
│   └── 6_Technical_Documentation.md (this file)
│
├── FlowChartSkillSync.jpeg          # System flowchart diagram
└── README.md                        # Project overview and quick start
```

---

## 2. Standard Microservice Internal Structure

Every Spring Boot microservice follows this package layout:

```
com.skillsync.{servicename}
├── controller/          # REST controllers (@RestController)
│   └── internal/        # Feign-accessible endpoints (bypasses GatewayRequestFilter)
├── service/
│   ├── {Name}Service    # Interface
│   └── {Name}ServiceImpl# Business logic
├── repository/          # JPA repositories (Spring Data)
├── entity/              # JPA entities
├── dto/
│   ├── request/         # Incoming request DTOs
│   └── response/        # Outgoing response DTOs
├── event/               # RabbitMQ event POJOs
├── publisher/           # RabbitMQ event publishers
├── consumer/            # RabbitMQ @RabbitListener classes
├── feign/               # Feign client interfaces
├── filter/              # Security filters (GatewayRequestFilter)
├── exception/           # Custom exceptions + @ControllerAdvice
├── config/              # Spring configuration classes
│   ├── RabbitMQConfig   # Exchange/queue declarations
│   ├── RedisConfig      # Redis connection
│   └── SecurityConfig   # Spring Security filter chain
├── audit/               # AuditLog entity + service
└── {ServiceName}Application.java   # Main class
```

---

## 3. Configuration Overview

### 3.1 Config Server Architecture

```
Git Repository (config-repo/)
  └── {service-name}.properties    # Per-service configuration
      → spring.datasource.*        # DB URL, credentials
      → spring.rabbitmq.*          # RabbitMQ connection
      → spring.data.redis.*        # Redis connection
      → jwt.secret, jwt.expiry     # JWT settings
      → razorpay.*                 # Payment keys
      → mail.*                     # SMTP settings

Config Server (port 8888)
  → Fetches from Git repo on startup
  → All services call Config Server at bootstrap
  → Config Server caches properties in memory

Service Bootstrap Order:
  1. Config Server must be HEALTHY before services start
  2. All services fetch config from Config Server at startup
  3. Hot reload supported via /actuator/refresh
```

### 3.2 Key Environment Variables

```bash
# Shared across all services (from .env file)
SPRING_PROFILES_ACTIVE=prod            # Spring profile selection
EUREKA_DEFAULT_ZONE=http://eureka-server:8761/eureka/

# Database
MYSQL_ROOT_PASSWORD=****
MYSQL_USER=skillsync
MYSQL_PASSWORD=****

# Redis
REDIS_PASSWORD=****

# RabbitMQ
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=****

# JWT
JWT_SECRET=****                        # HS256 signing key (min 256 bits)
JWT_EXPIRY=3600000                     # 1 hour in milliseconds

# Auth Service
GOOGLE_CLIENT_ID=****                  # Google OAuth2 client ID
SPRING_MAIL_USERNAME=****              # SMTP email
SPRING_MAIL_PASSWORD=****             # SMTP app password

# Payment
RAZORPAY_KEY_ID=****
RAZORPAY_KEY_SECRET=****

# MinIO (for profile images)
MINIO_URL=http://minio:9000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=****

# Azure Container Registry
ACR_LOGIN_SERVER=skillsyncadmin.azurecr.io
```

---

## 4. Build & Runtime Flow

### 4.1 Backend Build Pipeline

```
1. Developer pushes to GitHub (main/development/feature/*)
2. GitHub Actions triggers:
   a. backend-quality job:
      - Checkout code
      - Set up JDK 21
      - Run: mvn clean verify sonar:sonar
      - SonarCloud quality gate checked
   b. frontend-quality job:
      - Set up Node.js 18
      - npm ci
      - npm run lint (ESLint strict TypeScript)

3. build-and-push job (matrix: 14 services):
   - For each changed service:
     - Login to Azure Container Registry (ACR)
     - docker build-push-action (multi-stage Dockerfile)
     - Push: :latest + :${github.sha} tags
     - Cleanup old ACR tags (keep latest 5)

4. deploy job:
   - SSH to Azure VM
   - Create skillsync-proxy network (if missing)
   - Disk pre-flight check (auto-cleanup if < 1GB free)
   - git pull (sync code)
   - docker compose down → pull → up --force-recreate
   - Post-deploy: docker ps + disk status + prune
```

### 4.2 Backend Multi-Stage Dockerfile Pattern

```dockerfile
# Stage 1: Maven build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 4.3 Frontend Multi-Stage Dockerfile

```dockerfile
# Stage 1: Angular build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --prod

# Stage 2: Nginx serve
FROM nginx:alpine
COPY --from=build /app/dist/skillsync /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 5. Observability Stack

### 5.1 Metrics (Prometheus + Grafana)

```yaml
# prometheus.yml — scrape config
scrape_configs:
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:8081']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 15s
  # ... repeated for each service
```

**Key Metrics Available:**
| Metric | Description |
|--------|-------------|
| `http_server_requests_seconds` | HTTP request latency by status, method, URI |
| `jvm_memory_used_bytes` | JVM heap/non-heap usage |
| `jvm_gc_pause_seconds` | GC pause duration |
| `spring_rabbitmq_listener_seconds` | RabbitMQ message processing time |
| `resilience4j_circuitbreaker_state` | Circuit breaker state per Feign client |

### 5.2 Distributed Tracing (Zipkin)

```java
// Automatic trace propagation via Micrometer Bridge
// All service-to-service calls carry:
traceparent: 00-{traceId}-{spanId}-01

// In logs (logstash-logback-encoder):
{"traceId":"abc123", "spanId":"def456", "service":"session-service", "message":"..."}
```

Access Zipkin: `http://localhost:9411`

### 5.3 Centralized Logging (Loki + Promtail)

```yaml
# promtail-config.yml
scrape_configs:
  - job_name: docker-logs
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
    relabel_configs:
      - source_labels: [__meta_docker_container_name]
        target_label: container
    pipeline_stages:
      - json:
          expressions:
            output: log
            level: level
            traceId: traceId
```

Access logs in Grafana → Explore → Loki datasource
Query example: `{container="session-service"} |= "ERROR"`

### 5.4 Log Level Configuration

```properties
# config-repo/application.properties (shared)
logging.level.root=INFO
logging.level.com.skillsync=DEBUG
logging.level.org.springframework.amqp=WARN
logging.level.org.hibernate.SQL=DEBUG  # (dev profile only)
```

---

## 6. Testing Strategy

### 6.1 Backend Testing

| Test Type | Framework | Location | Coverage Target |
|-----------|-----------|----------|----------------|
| Unit Tests | JUnit 5 + Mockito | `src/test/java/` | >75% (SonarCloud gate) |
| Integration Tests | Spring Boot Test | `src/test/java/` | Key API paths |
| Test Runner | Maven Surefire | `mvn clean verify` | — |

**Key test patterns:**
```java
@ExtendWith(MockitoExtension.class)
class SessionCommandServiceTest {
    @Mock SessionRepository sessionRepository;
    @InjectMocks SessionCommandServiceImpl service;
}

// Controller tests
@WebMvcTest(SessionController.class)
class SessionControllerTest { ... }
```

### 6.2 Frontend Testing

| Test Type | Framework | Location | Coverage Target |
|-----------|-----------|----------|----------------|
| Unit Tests | Karma + Jasmine | `src/**/*.spec.ts` | >85% (SonarCloud gate) |
| Linting | ESLint (strict TypeScript) | `npm run lint` | Zero warnings on CI |
| Coverage Reports | Istanbul (via Karma) | `coverage/` directory | — |

**Coverage commands:**
```bash
# Run tests with coverage
npm test -- --code-coverage --watch=false

# View coverage report
open coverage/skillsync/index.html
```

### 6.3 CI Quality Gate

```yaml
# main_ci_cd.yml — backend quality
mvn clean verify sonar:sonar \
  -Dsonar.projectKey=SriramAkula_SkillSync \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=${{ secrets.SONAR_TOKEN }}

# frontend quality
npm run lint  # Must exit 0 to proceed
```

---

## 7. API Documentation

### 7.1 Swagger UI Access

```
http://localhost:8081/swagger-ui.html  → Auth Service
http://localhost:8082/swagger-ui.html  → User Service
http://localhost:8083/swagger-ui.html  → Skill Service
http://localhost:8084/swagger-ui.html  → Session Service
http://localhost:8085/swagger-ui.html  → Mentor Service
http://localhost:8086/swagger-ui.html  → Group Service
http://localhost:8087/swagger-ui.html  → Review Service
http://localhost:8088/swagger-ui.html  → Notification Service
http://localhost:8089/swagger-ui.html  → Payment Service
http://localhost:9090/swagger-ui.html  → API Gateway (aggregated)
```

**Note:** API Gateway JWT filter blocks some paths. Use direct service URLs for development testing.

### 7.2 OpenAPI JSON Endpoints

```
GET /v3/api-docs   → OpenAPI 3.0 JSON spec for each service
```

---

## 8. Docker Compose Startup Order

```
docker compose -f docker-compose.infra.yml up -d
# Starts: MySQL (10 DBs), Redis, RabbitMQ, Zipkin, Config Server, Eureka
# Wait for all healthchecks to pass before proceeding

docker compose -f docker-compose.monitoring.yml up -d
# Starts: Prometheus, Grafana, Loki, Promtail

docker compose -f docker-compose.services.yml up -d
# Starts: All 11 microservices
# Depends on: Config Server (healthy), Eureka, MySQL (per service), RabbitMQ

cd ../frontend
docker compose up -d
# Starts: Nginx + Angular SPA
```

---

## 9. Service Health Verification

```bash
# Check all service health endpoints
for port in 8081 8082 8083 8084 8085 8086 8087 8088 8089 9090 8761 8888; do
  echo "Port $port: $(curl -s http://localhost:$port/actuator/health | jq -r '.status')"
done

# Verify Eureka registrations
curl http://localhost:8761/eureka/apps | grep "<app>"

# Check RabbitMQ queues
curl -u guest:guest http://localhost:15672/api/queues | jq '.[].name'

# Test API Gateway routing
curl -H "Authorization: Bearer <JWT>" http://localhost:9090/api/users/me
```

---

## 10. Integration Points Summary

| Integration | Direction | Protocol | Authentication |
|-------------|-----------|----------|----------------|
| Angular → API Gateway | Outbound | HTTPS | Bearer JWT |
| API Gateway → Microservices | Internal | HTTP | X-Gateway-Request header |
| Session Service → User Service | Feign | HTTP | X-Gateway-Request |
| Session Service → Mentor Service | Feign | HTTP | X-Gateway-Request |
| Mentor Service → User Service | Feign | HTTP | X-Gateway-Request |
| Auth Service → RabbitMQ | Publish | AMQP | RabbitMQ credentials |
| Session Service → RabbitMQ | Publish | AMQP | RabbitMQ credentials |
| Review Service → RabbitMQ | Publish | AMQP | RabbitMQ credentials |
| Notification Service → RabbitMQ | Subscribe | AMQP | RabbitMQ credentials |
| User Service → RabbitMQ | Subscribe | AMQP | RabbitMQ credentials |
| Mentor Service → RabbitMQ | Subscribe | AMQP | RabbitMQ credentials |
| Auth Service → Google OAuth2 | Outbound | HTTPS | Google ID Token |
| Payment Service → Razorpay | Outbound | HTTPS | Key ID + Secret |
| Razorpay → Payment Service | Inbound | HTTPS Webhook | HMAC-SHA256 signature |
| Notification Service → SMTP | Outbound | SMTP/TLS | Email + App Password |
| All Services → Zipkin | Outbound | HTTP | None (internal) |
| Prometheus → All Services | Inbound pull | HTTP | None (internal) |
| Promtail → Docker Logs | Pull | Docker socket | Unix socket |

---

## 11. Known Limitations & Future Work

| Area | Current State | Future Work |
|------|--------------|-------------|
| **Messaging Service** | WebSocket/STOMP infrastructure configured; service not production-ready | Complete STOMP integration with RabbitMQ; implement ChatStore in frontend |
| **Payment** | Razorpay INR only; single currency | Multi-currency support; alternative payment gateways |
| **Database** | All 10 MySQL DBs on same instance | Separate managed MySQL instances per service for production |
| **Auto-scaling** | Manual `docker compose up --scale` | Kubernetes + Horizontal Pod Autoscaler |
| **Session Completion** | Status transition to COMPLETED not implemented | Scheduled job or webhook-based completion trigger |
| **Admin Notifications** | No admin-specific notification feed | Dedicated admin notification stream |
| **File Upload** | MinIO configured for user-service | Full MinIO integration for profile images |
| **Rate Limiting** | Not implemented at Gateway | Spring Cloud Gateway RequestRateLimiter with Redis |

---

## 12. Quick Reference Commands

```bash
# ── Development ──────────────────────────────────────────

# Start only infrastructure
cd backend
docker compose -f docker-compose.infra.yml up -d

# Run a single service locally
cd backend/session-service
mvn spring-boot:run

# Start frontend dev server
cd frontend
npm start   # Proxies API calls to localhost:9090

# ── Testing ──────────────────────────────────────────────

# Backend tests (per service)
cd backend/auth-service
mvn clean verify

# Frontend unit tests with coverage
cd frontend
npm run test -- --code-coverage --watch=false

# Frontend lint
npm run lint

# ── Monitoring ───────────────────────────────────────────

# View Grafana (admin/admin)
open http://localhost:3000

# View Zipkin traces
open http://localhost:9411

# View Prometheus metrics
open http://localhost:9090/metrics

# View RabbitMQ management
open http://localhost:15672   # guest/guest

# View Eureka dashboard
open http://localhost:8761

# ── Docker ───────────────────────────────────────────────

# View all running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Follow logs of a service
docker logs -f session-service

# Force rebuild + deploy
docker compose down && docker compose up -d --build
```

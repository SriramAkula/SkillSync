# SkillSync — Documentation Index

> **Platform:** Mentor-Learner Microservices | **Stack:** Spring Boot 3.4.11 + Angular 18 + Docker

---

## 📐 Architecture Documents

| Document | Description | Diagrams |
|----------|-------------|---------|
| [HLD.md](./HLD.md) | High Level Design — system overview, layers, communication patterns, security model | ✅ Architecture image |
| [LLD.md](./LLD.md) | Low Level Design — service internals, CQRS, REST contracts, entity schemas, event flows | ✅ Service detail image |
| [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md) | CI/CD pipeline, Docker Compose stacks, Azure VM setup, monitoring, SSL | ✅ Pipeline diagram (Mermaid) |

---

## 🗺️ Diagrams

| Image | Description | Location |
|-------|-------------|---------|
| `hld_architecture.png` | Full system HLD — all layers from Angular → MySQL | [images/hld_architecture.png](./images/hld_architecture.png) |
| `lld_service_detail.png` | LLD — Full CQRS + Event-Driven flow | [images/lld_service_detail.png](./images/lld_service_detail.png) |

---

## 🔧 Services Quick Reference

| Service | Port | Database | Messaging Role |
|---------|------|----------|---------------|
| **Auth Service** | 8081 | `skill_auth` | **Publisher**: UserCreatedEvent, UserUpdatedEvent |
| **User Service** | 8082 | `skill_user` | **Consumer**: UserCreatedEvent, UserUpdatedEvent |
| **Skill Service** | 8083 | `skill_skill` | N/A |
| **Session Service** | 8084 | `skill_session` | **Publisher**: SessionRequested/Accepted/Rejected/Cancelled events |
| **Mentor Service** | 8085 | `skill_mentor` | **Consumer**: ReviewSubmittedEvent (rating update) |
| **Group Service** | 8086 | `skill_group` | N/A |
| **Review Service** | 8087 | `skill_review` | **Publisher**: ReviewSubmittedEvent |
| **Notification Service** | 8088 | `skill_notification` | **Consumer**: ALL domain events → sends emails |
| **Payment Gateway** | 8089 | `skill_payment` | **Publisher**: PaymentCompletedEvent |
| **Config Server** | 8888 | Git repo | N/A |
| **Eureka Server** | 8761 | In-memory | N/A |
| **API Gateway** | 9090 | N/A | N/A |

---

## 📡 RabbitMQ Event Map

```
Auth Service       ──TOPIC──► user.created    ──► User Service
Auth Service       ──TOPIC──► user.updated    ──► User Service
Session Service    ──TOPIC──► session.*       ──► Notification Service
Review Service     ──TOPIC──► review.*        ──► Notification Service + Mentor Service
```

---

## 🏗️ Quick Start

```bash
# Start all backend services
cd backend
docker compose -f docker-compose.infra.yml \
               -f docker-compose.services.yml \
               -f docker-compose.monitoring.yml up -d

# Start frontend
cd ../frontend
docker compose up -d
```

---

*Generated: April 2026 | SkillSync Development Team*

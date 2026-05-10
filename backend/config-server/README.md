# Config Server — SkillSync

> **Port:** 8888 | **Spring Boot:** 3.4.11 | **Framework:** Spring Cloud Config Server

The Config Server centralizes all microservice configurations, fetching property files from a Git-backed repository (`config-repo/`). All services call the Config Server at bootstrap via `spring.cloud.config.uri`.

---

## ⚙️ Configuration Files (config-repo/)

| File | Service |
|------|---------|
| `auth-service.properties` | Auth Service |
| `user-service.properties` | User Service |
| `skill-service.properties` | Skill Service |
| `session-service.properties` | Session Service |
| `mentor-service.properties` | Mentor Service |
| `group-service.properties` | Group Service |
| `review-service.properties` | Review Service |
| `notification-service.properties` | Notification Service |
| `payment-gateway.properties` | Payment Gateway |
| `messaging-service.properties` | Messaging Service |
| `api-gateway.properties` | API Gateway |
| `application.properties` | Shared defaults (all services) |

---

## 🔑 Typical Properties Managed

```properties
# Database
spring.datasource.url=jdbc:mysql://mysql:3306/skill_{service}
spring.datasource.username=skillsync
spring.datasource.password=${MYSQL_PASSWORD}

# Redis
spring.data.redis.host=redis
spring.data.redis.port=6379

# RabbitMQ
spring.rabbitmq.host=rabbitmq
spring.rabbitmq.port=5672
spring.rabbitmq.username=admin
spring.rabbitmq.password=${RABBITMQ_PASSWORD}

# JWT (Auth Service only)
jwt.secret=${JWT_SECRET}
jwt.expiry=3600000

# Razorpay (Payment Gateway only)
razorpay.key.id=${RAZORPAY_KEY_ID}
razorpay.key.secret=${RAZORPAY_KEY_SECRET}
```

---

## 🔗 Dependencies

- All 9 microservices + API Gateway **depend on Config Server being healthy** before startup
- Docker Compose healthcheck ensures startup ordering: Config Server → Eureka → Microservices

# API Gateway — SkillSync

> **Port:** 9090 | **Spring Boot:** 3.4.11 | **Framework:** Spring Cloud Gateway

The API Gateway is the single entry point for all client traffic. It validates JWTs, injects identity headers (`X-User-Id`, `roles`), and routes requests to downstream microservices via Eureka-backed load-balanced URIs (`lb://service-name`).

---

## 📦 Package Structure

```
com.skillsync.apigateway
├── JwtAuthenticationFilter         # GlobalFilter: validates JWT, injects X-User-Id + roles headers
├── JwtUtil                         # JWT parsing and validation (HS256)
├── CorsConfig                      # CORS policy configuration
├── GlobalErrorHandler              # Reactive error handling (WebFlux)
├── OpenApiConfig                   # Swagger/OpenAPI aggregation config
└── ApiGatewayApplication           # Main class
```

---

## 🔐 JWT Authentication Filter Logic

```
1. OPTIONS requests → Skip (CORS preflight)
2. Add X-Gateway-Request: true header to all requests
3. If NOT a public endpoint:
   a. Check Authorization header is present
   b. Validate "Bearer " prefix
   c. Call JwtUtil.validateToken(token)
   d. Extract: email (sub), userId, roles from Claims
   e. Mutate request headers:
      → X-User-Id: {userId}
      → loggedInUser: {email}
      → roles: {ROLE_LEARNER,ROLE_MENTOR,...}
4. Forward to downstream service
```

---

## 🌐 Route Configuration

Routes are managed via **Spring Cloud Config Server** (`api-gateway.properties`):

| Route ID | Path Pattern | Target Service |
|----------|-------------|----------------|
| `auth-service` | `/api/auth/**` | `lb://auth-service` |
| `user-service` | `/api/users/**` | `lb://user-service` |
| `skill-service` | `/api/skills/**` | `lb://skill-service` |
| `session-service` | `/api/session/**` | `lb://session-service` |
| `mentor-service` | `/api/mentor/**` | `lb://mentor-service` |
| `group-service` | `/api/groups/**` | `lb://group-service` |
| `review-service` | `/api/review/**` | `lb://review-service` |
| `notification-service` | `/api/notifications/**` | `lb://notification-service` |
| `payment-service` | `/api/payment/**` | `lb://payment-gateway` |
| `messaging-service` | `/api/messages/**` | `lb://messaging-service` |

---

## 🔓 Public Endpoints (No JWT Required)

```java
List<String> PUBLIC_ENDPOINTS = List.of(
    "/api/auth/login", "/api/auth/register", "/api/auth/refresh",
    "/api/auth/send-otp", "/api/auth/verify-otp",
    "/api/auth/forgot-password", "/api/auth/verify-forgot-password",
    "/api/auth/reset-password", "/api/auth/oauth/google",
    "/api/payment/payments",  // Razorpay webhook
    "/eureka", "/swagger-ui", "/v3/api-docs", "/webjars/"
);
```

---

## ⚙️ Key Configuration

```properties
# Config Server delivers these to the gateway
spring.cloud.gateway.routes[0].id=auth-service
spring.cloud.gateway.routes[0].uri=lb://auth-service
spring.cloud.gateway.routes[0].predicates[0]=Path=/api/auth/**

eureka.client.serviceUrl.defaultZone=http://eureka-server:8761/eureka/
```

---

## 🔗 Inter-Service Dependencies

- **Eureka Server**: Service discovery for all `lb://` route targets
- **Config Server**: Receives route configuration dynamically
- **All Downstream Services**: Forwards `X-User-Id`, `roles`, `X-Gateway-Request` headers

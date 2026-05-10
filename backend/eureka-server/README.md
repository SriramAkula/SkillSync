# Eureka Server — SkillSync

> **Port:** 8761 | **Spring Boot:** 3.4.11 | **Framework:** Spring Cloud Netflix Eureka

The Eureka Server acts as the service registry for all SkillSync microservices. Every service registers itself with Eureka on startup. The API Gateway uses Eureka to resolve `lb://service-name` URIs with round-robin load balancing.

---

## 🔍 How It Works

```
1. Each service starts → registers with Eureka (every 30s heartbeat)
2. API Gateway queries Eureka → resolves lb://session-service → actual host:port
3. Spring Cloud LoadBalancer picks an instance (round-robin)
4. If service stops → deregistered after timeout (configurable lease expiry)
```

---

## 🌐 Dashboard

```
http://localhost:8761
```

The Eureka Dashboard shows all registered service instances, their status (UP/DOWN), and last heartbeat time.

---

## ⚙️ Configuration

```properties
# eureka-server application.properties
eureka.client.register-with-eureka=false
eureka.client.fetch-registry=false
server.port=8761
```

All services register via:
```properties
eureka.client.serviceUrl.defaultZone=http://eureka-server:8761/eureka/
spring.application.name=<service-name>
```

---

## 🔗 Dependencies

- **Config Server**: Must be healthy before Eureka starts (in Docker Compose ordering)
- **All microservices + API Gateway**: Register with Eureka for service discovery

# SkillSync Backend — Complete Annotation Reference

> Every annotation used across the **13 microservices** of the SkillSync backend, organized by category with real project examples.

---

## Table of Contents

1. [Spring Boot Core](#1-spring-boot-core)
2. [Spring Web / REST](#2-spring-web--rest)
3. [Spring Data / JPA (Jakarta Persistence)](#3-spring-data--jpa-jakarta-persistence)
4. [Spring Cloud & Microservices](#4-spring-cloud--microservices)
5. [Spring Security](#5-spring-security)
6. [RabbitMQ / Messaging](#6-rabbitmq--messaging)
7. [Caching (Redis)](#7-caching-redis)
8. [AOP (Aspect-Oriented Programming)](#8-aop-aspect-oriented-programming)
9. [Swagger / OpenAPI Documentation](#9-swagger--openapi-documentation)
10. [Lombok (Boilerplate Reduction)](#10-lombok-boilerplate-reduction)
11. [Jakarta Validation (Bean Validation)](#11-jakarta-validation-bean-validation)
12. [Jackson (JSON Serialization)](#12-jackson-json-serialization)
13. [Hibernate-Specific](#13-hibernate-specific)
14. [Testing Annotations](#14-testing-annotations)

---

## 1. Spring Boot Core

### `@SpringBootApplication`
**Package:** `org.springframework.boot.autoconfigure`
**What it does:** Combination of `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. Marks the main entry-point class for a Spring Boot app.
**Used in:** Every microservice's `Application.java`

```java
// auth-service — AuthServiceApplication.java
@SpringBootApplication
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
```

---

### `@Configuration`
**Package:** `org.springframework.context.annotation`
**What it does:** Marks a class as a source of Spring bean definitions. Methods annotated with `@Bean` inside will be registered as beans.
**Used in:** `SecurityConfig`, `RedisConfig`, `RabbitMQConfig`, `OpenApiConfig`, `JwtConfig`, `FeignConfig`, `CorsConfig`, `AuditConfig` across all services

```java
// auth-service — SecurityConfig.java
@Configuration
@EnableWebSecurity
public class SecurityConfig { ... }
```

---

### `@Bean`
**Package:** `org.springframework.context.annotation`
**What it does:** Tells Spring to register the return value of this method as a managed bean in the application context.
**Used in:** All `@Configuration` classes — to define `SecurityFilterChain`, `PasswordEncoder`, `RabbitTemplate`, `RedisTemplate`, etc.

```java
// auth-service — SecurityConfig.java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}

// auth-service — RabbitMQConfig.java
@Bean
public TopicExchange authExchange() {
    return new TopicExchange(AUTH_EXCHANGE, true, false);
}
```

---

### `@ConfigurationProperties`
**Package:** `org.springframework.boot.context.properties`
**What it does:** Binds external configuration properties (from `application.yml`) to a Java POJO. Allows type-safe access to config values.
**Used in:** `auth-service` — `JwtConfig`

```java
// auth-service — JwtConfig.java
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private String secret;
    private long expiration;
    private long refreshExpiration;
    // getters and setters
}
```

---

### `@Value`
**Package:** `org.springframework.beans.factory.annotation`
**What it does:** Injects a single value from the application properties or environment variables into a field.
**Used in:** `user-service` — `SecurityContextUtil`

```java
// user-service — SecurityContextUtil.java
@Value("${jwt.secret}")
private String jwtSecret;
```

---

### `@Component`
**Package:** `org.springframework.stereotype`
**What it does:** Marks a generic Spring-managed bean. Specializations include `@Service`, `@Repository`, `@Controller`.
**Used in:** `JwtUtil`, `JwtFilter`, `InternalServiceFilter`, `GatewayRequestFilter`, `AuthEventPublisher`, `AuthMapper`, `SessionEventPublisher`, `SessionMapper`, `SkillMapper`, `MentorMapper`, `ReviewMapper`, `GroupMapper`, `PaymentSagaMapper`, `MessageEventPublisher`, `MentorServiceFallback`, `SecurityExceptionHandler`, all filter classes, etc.

```java
// auth-service — JwtUtil.java
@Component
public class JwtUtil { ... }

// api-gateway — GlobalErrorHandler.java
@Component
@Order(-1)
public class GlobalErrorHandler implements ErrorWebExceptionHandler { ... }
```

---

### `@Service`
**Package:** `org.springframework.stereotype`
**What it does:** Specialized `@Component` for business-logic classes. Semantically marks a service-layer bean.
**Used in:** Every `*ServiceImpl`, `*CommandService`, `*QueryService`, `AuditService`, `EmailService`, `OtpService`, `OAuthService`, `AuthServiceImpl`, `CustomUserDetailsService`, `PaymentProcessor`, `SagaOrchestrator`

```java
// auth-service — AuthServiceImpl.java
@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService { ... }
```

---

### `@Repository`
**Package:** `org.springframework.stereotype`
**What it does:** Specialized `@Component` for data-access classes. Also triggers Spring's exception translation for database errors.
**Used in:** Every `*Repository` interface across all services

```java
// auth-service — UserRepository.java
@Repository
public interface UserRepository extends JpaRepository<User, Long> { ... }
```

---

### `@Order`
**Package:** `org.springframework.core.annotation`
**What it does:** Defines the execution priority of a component. Lower values = higher priority.
**Used in:** `api-gateway` — `GlobalErrorHandler`

```java
// api-gateway — GlobalErrorHandler.java
@Component
@Order(-1)
public class GlobalErrorHandler implements ErrorWebExceptionHandler { ... }
```

---

## 2. Spring Web / REST

### `@RestController`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Combines `@Controller` + `@ResponseBody`. Every method return value is automatically serialized to JSON.
**Used in:** `AuthController`, `InternalUserController`, `UserProfileController`, `MentorController`, `SessionController`, `SkillController`, `ReviewController`, `NotificationController`, `MessageController`, `GroupController`, `PaymentController`

```java
// auth-service — AuthController.java
@RestController
@RequestMapping("/auth")
public class AuthController { ... }
```

---

### `@RequestMapping`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Maps HTTP requests to a handler class or method. Defines the base URL path for a controller.
**Used in:** All controller classes

```java
@RequestMapping("/auth")     // AuthController
@RequestMapping("/user")     // UserProfileController
@RequestMapping("/mentor")   // MentorController
@RequestMapping("/session")  // SessionController
@RequestMapping("/skill")    // SkillController
@RequestMapping("/review")   // ReviewController
@RequestMapping("/notification")  // NotificationController
@RequestMapping("/messaging")     // MessageController
@RequestMapping("/group")    // GroupController
@RequestMapping("/payments") // PaymentController
@RequestMapping("/internal/users") // InternalUserController
```

---

### `@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping` / `@PatchMapping`
**Package:** `org.springframework.web.bind.annotation`
**What they do:** Shortcut annotations for `@RequestMapping(method = ...)`. Map specific HTTP verbs to handler methods.
**Used in:** All controllers

```java
// auth-service — AuthController.java
@PostMapping("/login")
public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) { ... }

// user-service — UserProfileController.java
@GetMapping("/profile/{userId}")
public ResponseEntity<ApiResponse<UserProfileResponseDto>> getUserProfile(@PathVariable Long userId) { ... }

@PutMapping("/profile")
public ResponseEntity<ApiResponse<UserProfileResponseDto>> updateProfile(...) { ... }
```

---

### `@RequestBody`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Binds the HTTP request body (JSON) to a Java object via Jackson deserialization.
**Used in:** All POST/PUT controller methods

```java
public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) { ... }
```

---

### `@PathVariable`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Extracts a value from the URL path template (`/user/{userId}`) and binds it to a method parameter.
**Used in:** All controllers with dynamic URL segments

```java
@GetMapping("/profile/{userId}")
public ResponseEntity<...> getUserProfile(@PathVariable Long userId) { ... }
```

---

### `@RequestParam`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Extracts query parameters (`?page=0&size=20`) from the URL and binds them to method parameters.
**Used in:** Paginated endpoints across all controllers

```java
@GetMapping("/admin/all")
public ResponseEntity<...> getAllUsers(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size) { ... }
```

---

### `@RequestHeader`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Extracts a specific HTTP header value and binds it to a method parameter.
**Used in:** All controllers that rely on gateway-injected headers (`X-User-Id`, `loggedInUser`, `roles`)

```java
@GetMapping("/profile")
public ResponseEntity<...> getProfile(
    @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
    @RequestHeader(value = "loggedInUser", required = false) String headerEmail,
    @RequestHeader(value = "roles", required = false) String roles) { ... }
```

---

### `@CookieValue`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Extracts the value of an HTTP cookie and binds it to a method parameter.
**Used in:** `auth-service` — `AuthController.refreshToken()`

```java
@PostMapping("/refresh")
public ResponseEntity<AuthResponse> refreshToken(
    @CookieValue(name = "refreshToken", required = false) String refreshToken,
    @RequestHeader(value = "Authorization", required = false) String authHeader) { ... }
```

---

### `@ResponseStatus`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Sets the default HTTP status code returned when this exception is thrown.
**Used in:** `user-service` — `UsernameAlreadyExistsException`

```java
@ResponseStatus(HttpStatus.CONFLICT)
public class UsernameAlreadyExistsException extends RuntimeException { ... }
```

---

### `@ControllerAdvice` / `@RestControllerAdvice`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Global exception handler. Intercepts exceptions thrown by controllers and returns structured error responses.
**Used in:** `GlobalExceptionHandler` in every microservice

```java
// auth-service uses @ControllerAdvice
@ControllerAdvice
public class GlobalExceptionHandler { ... }

// All other services use @RestControllerAdvice
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler { ... }
```

---

### `@ExceptionHandler`
**Package:** `org.springframework.web.bind.annotation`
**What it does:** Marks a method inside `@ControllerAdvice` to handle a specific exception type.
**Used in:** Every `GlobalExceptionHandler` class

```java
@ExceptionHandler(UserProfileNotFoundException.class)
public ResponseEntity<ErrorResponse> handleUserNotFound(UserProfileNotFoundException ex) { ... }

@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) { ... }

@ExceptionHandler(Exception.class)
public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) { ... }
```

---

## 3. Spring Data / JPA (Jakarta Persistence)

### `@Entity`
**Package:** `jakarta.persistence`
**What it does:** Marks a class as a JPA entity mapped to a database table.
**Used in:** `User`, `UserProfile`, `MentorProfile`, `Session`, `Skill`, `Review`, `Notification`, `Message`, `Group`, `GroupMember`, `PaymentSaga`, `AuditLog`

```java
@Entity
@Table(name = "users")
public class User extends Auditable { ... }
```

---

### `@Table`
**Package:** `jakarta.persistence`
**What it does:** Specifies the database table name, indexes, and unique constraints for an entity.
**Used in:** All `@Entity` classes

```java
@Table(name = "user_profiles", uniqueConstraints = {
    @UniqueConstraint(columnNames = "userId")
})

@Table(name = "mentor_profiles", uniqueConstraints = {
    @UniqueConstraint(columnNames = "userId")
})

@Table(name = "payment_saga", indexes = {
    @Index(name = "idx_session_id", columnList = "sessionId")
})

@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_entity", columnList = "entityType,entityId")
})
```

---

### `@Id`
**Package:** `jakarta.persistence`
**What it does:** Marks a field as the primary key of the entity.
**Used in:** All entity classes

---

### `@GeneratedValue`
**Package:** `jakarta.persistence`
**What it does:** Specifies the primary key generation strategy.
**Used in:** All entities — using `GenerationType.IDENTITY` (auto-increment by the database)

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

---

### `@Column`
**Package:** `jakarta.persistence`
**What it does:** Customizes the column mapping — name, nullable, unique, length, updatable.
**Used in:** All entity fields

```java
@Column(nullable = false, unique = true)
private String email;

@Column(length = 500)
private String bio;

@Column(nullable = false, updatable = false)
private LocalDateTime createdAt;
```

---

### `@Enumerated`
**Package:** `jakarta.persistence`
**What it does:** Maps a Java `enum` field to a database column. `EnumType.STRING` stores the enum name as text.
**Used in:** `auth-service` — `User.authProvider`, `mentor-service` — `MentorProfile.status`, `MentorProfile.availabilityStatus`

```java
@Enumerated(EnumType.STRING)
@Column(name = "auth_provider", nullable = false, length = 20)
private AuthProvider authProvider = AuthProvider.LOCAL;
```

---

### `@UniqueConstraint`
**Package:** `jakarta.persistence`
**What it does:** Defines a multi-column unique constraint at the table level inside `@Table`.
**Used in:** `UserProfile`, `MentorProfile`, `Session`, `Skill`, `GroupMember`

```java
@Table(name = "sessions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"learnerId", "mentorId", "scheduledAt"})
})
```

---

### `@Index`
**Package:** `jakarta.persistence`
**What it does:** Creates a database index on specified columns for faster queries.
**Used in:** `PaymentSaga`, `AuditLog`

```java
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_entity", columnList = "entityType,entityId")
})
```

---

### `@PrePersist`
**Package:** `jakarta.persistence`
**What it does:** Lifecycle callback. Method is called automatically before the entity is first saved (INSERT).
**Used in:** `user-service` — `UserProfile`

```java
@PrePersist
protected void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
    this.profileComplete = false;
}
```

---

### `@PreUpdate`
**Package:** `jakarta.persistence`
**What it does:** Lifecycle callback. Method is called automatically before the entity is updated (UPDATE).
**Used in:** `user-service` — `UserProfile`

```java
@PreUpdate
protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
}
```

---

### `@MappedSuperclass`
**Package:** `jakarta.persistence`
**What it does:** Marks a parent class whose fields are inherited by child entities but does NOT have its own table.
**Used in:** `Auditable` base class in every service

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class Auditable {
    @CreatedBy
    private String createdBy;
    @LastModifiedBy
    private String lastModifiedBy;
}
```

---

### `@EntityListeners`
**Package:** `jakarta.persistence`
**What it does:** Registers a JPA entity listener class that reacts to entity lifecycle events.
**Used in:** `Auditable` base class — registers `AuditingEntityListener` for auto-populating `createdBy`/`lastModifiedBy`

```java
@EntityListeners(AuditingEntityListener.class)
public abstract class Auditable { ... }
```

---

### `@EnableJpaAuditing`
**Package:** `org.springframework.data.jpa.repository.config`
**What it does:** Enables Spring Data JPA's auditing support (auto-fills `@CreatedBy`, `@LastModifiedBy`).
**Used in:** `AuditConfig` in auth, user, mentor, session, skill, review, payment, group services

```java
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig { ... }
```

---

### `@CreatedBy` / `@LastModifiedBy`
**Package:** `org.springframework.data.annotation`
**What it does:** Automatically populates the field with the current user's identity on create/update via `AuditorAware`.
**Used in:** `Auditable` base class

```java
@CreatedBy
@Column(name = "created_by", updatable = false, length = 50)
private String createdBy;

@LastModifiedBy
@Column(name = "last_modified_by", length = 50)
private String lastModifiedBy;
```

---

### `@Query`
**Package:** `org.springframework.data.jpa.repository`
**What it does:** Defines custom JPQL or native SQL queries on repository methods.
**Used in:** `SessionRepository`, `SkillRepository`, `ReviewRepository`, `MentorRepository`, `GroupRepository`, `MessageRepository`

```java
// session-service — SessionRepository.java
@Query("SELECT s FROM Session s WHERE s.mentorId = :mentorId")
Page<Session> findByMentorIdPaged(@Param("mentorId") Long mentorId, Pageable pageable);

// review-service — ReviewRepository.java
@Query("SELECT AVG(r.rating) FROM Review r WHERE r.mentorId = :mentorId")
Double findAverageRatingByMentorId(@Param("mentorId") Long mentorId);
```

---

### `@Transactional`
**Package:** `org.springframework.transaction.annotation`
**What it does:** Wraps the method in a database transaction. If exception → auto-rollback. Ensures data integrity.
**Used in:** All `*CommandService` methods and service methods that write to the DB

```java
// user-service — UserProfileCommandService.java
@Transactional
@Caching(evict = { ... })
public UserProfileResponseDto updateProfile(Long userId, UpdateProfileRequestDto dto) { ... }
```

---

## 4. Spring Cloud & Microservices

### `@EnableDiscoveryClient`
**Package:** `org.springframework.cloud.client.discovery`
**What it does:** Registers this service with the Eureka service registry.
**Used in:** api-gateway, auth-service, user-service, mentor-service, session-service, skill-service, notification-service, messaging-service, review-service, payment-gateway, group-service, config-server

```java
@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication { ... }
```

---

### `@EnableEurekaServer`
**Package:** `org.springframework.cloud.netflix.eureka.server`
**What it does:** Turns this application into a Eureka service registry server.
**Used in:** `eureka-server`

```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication { ... }
```

---

### `@EnableConfigServer`
**Package:** `org.springframework.cloud.config.server`
**What it does:** Turns this application into a Spring Cloud Config Server to serve centralized configuration.
**Used in:** `config-server`

```java
@SpringBootApplication
@EnableConfigServer
@EnableDiscoveryClient
public class ConfigServerApplication { ... }
```

---

### `@EnableFeignClients`
**Package:** `org.springframework.cloud.openfeign`
**What it does:** Activates Feign HTTP clients in the service. Scans for `@FeignClient` interfaces.
**Used in:** user-service, mentor-service, session-service, notification-service, messaging-service, review-service, payment-gateway, group-service

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableCaching
public class UserServiceApplication { ... }
```

---

### `@FeignClient`
**Package:** `org.springframework.cloud.openfeign`
**What it does:** Declares a REST client interface. Spring generates the HTTP-calling implementation at runtime. Supports `fallback` for circuit-breaker resilience.
**Used in:** All services that call other services

```java
// user-service — AuthClient.java
@FeignClient(name = "auth-service", url = "${AUTH_SERVICE_URL:http://auth-service:8081}")
public interface AuthClient { ... }

// review-service — MentorServiceClient.java  (with fallback)
@FeignClient(name = "mentor-service", fallback = MentorServiceFallback.class)
public interface MentorServiceClient { ... }

// session-service — UserClient.java
@FeignClient(name = "user-service", url = "${USER_SERVICE_URL:http://user-service:8082}")
public interface UserClient { ... }

// payment-gateway — SessionServiceClient.java  (with fallback)
@FeignClient(name = "session-service", fallback = SessionServiceClient.SessionServiceFallback.class)
public interface SessionServiceClient { ... }
```

---

## 5. Spring Security

### `@EnableWebSecurity`
**Package:** `org.springframework.security.config.annotation.web.configuration`
**What it does:** Activates Spring Security's web security support and enables custom security configuration.
**Used in:** `SecurityConfig` in auth-service, user-service, mentor-service, session-service, skill-service, review-service, messaging-service, group-service, notification-service

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig { ... }
```

---

### `@SecurityRequirement`
**Package:** `io.swagger.v3.oas.annotations.security`
**What it does:** Marks a Swagger endpoint as requiring authentication. Adds the lock icon in Swagger UI.
**Used in:** Protected controller endpoints

```java
@GetMapping("/profile")
@SecurityRequirement(name = "bearerAuth")
public ResponseEntity<...> getProfile(...) { ... }
```

---

## 6. RabbitMQ / Messaging

### `@RabbitListener`
**Package:** `org.springframework.amqp.rabbit.annotation`
**What it does:** Marks a method as a consumer that listens to messages from a specific RabbitMQ queue.
**Used in:** `user-service` — `UserProfileEventListener`, `notification-service` — all `*EventConsumer` classes, `payment-gateway` — `SessionEventListener`

```java
// user-service — UserProfileEventListener.java
@RabbitListener(queues = RabbitMQConfig.USER_CREATED_QUEUE)
@Transactional
public void handleUserCreated(UserCreatedEvent event) {
    log.info("Received USER_CREATED event for userId: {}", event.getUserId());
    // Create user profile from auth event...
}

@RabbitListener(queues = RabbitMQConfig.USER_UPDATED_QUEUE)
@Transactional
public void handleUserUpdated(UserUpdatedEvent event) { ... }
```

---

## 7. Caching (Redis)

### `@EnableCaching`
**Package:** `org.springframework.cache.annotation`
**What it does:** Activates Spring's annotation-driven cache management.
**Used in:** `RedisConfig` and/or main `Application` class in auth-service, user-service, mentor-service, session-service, skill-service, review-service, group-service, notification-service

```java
@Configuration
@EnableCaching
@Slf4j
public class RedisConfig { ... }
```

---

### `@CacheConfig`
**Package:** `org.springframework.cache.annotation`
**What it does:** Class-level default cache configuration. Sets the cache name for all `@Cacheable`/`@CacheEvict` in the class.
**Used in:** `mentor-service` — `MentorServiceImpl`

```java
@Service
@CacheConfig(cacheNames = "mentor")
public class MentorServiceImpl implements MentorService { ... }
```

---

### `@Cacheable`
**Package:** `org.springframework.cache.annotation`
**What it does:** Caches the method's return value. Subsequent calls with the same key skip the method and return the cached result.
**Used in:** user-service (`UserProfileQueryService`), mentor-service (`MentorServiceImpl`)

```java
// user-service — UserProfileQueryService.java
@Cacheable(value = "user", key = "'userId_' + #userId")
public UserProfileResponseDto getProfileByUserId(Long userId) { ... }

// mentor-service — MentorServiceImpl.java
@Cacheable(key = "#mentorId")
public MentorProfileResponseDto getMentorProfile(Long mentorId) { ... }

@Cacheable(key = "'all_approved_p' + #page + '_s' + #size")
public PageResponse<MentorProfileResponseDto> getAllApprovedMentors(int page, int size) { ... }
```

---

### `@CacheEvict`
**Package:** `org.springframework.cache.annotation`
**What it does:** Removes an entry from the cache. Used on write operations to invalidate stale cached data.
**Used in:** user-service (`UserProfileCommandService`), mentor-service (`MentorServiceImpl`)

```java
// user-service — UserProfileCommandService.java
@CacheEvict(value = "user", key = "'userId_' + #userId")

// mentor-service — all write operations
@CacheEvict(allEntries = true)
public MentorProfileResponseDto approveMentor(Long mentorId, Long adminId) { ... }
```

---

### `@CachePut`
**Package:** `org.springframework.cache.annotation`
**What it does:** Always executes the method and puts the result into the cache. Does NOT skip execution like `@Cacheable`.
**Used in:** `user-service` — `UserProfileCommandService`

```java
@CachePut(value = "user", key = "'userId_' + #userId")
```

---

### `@Caching`
**Package:** `org.springframework.cache.annotation`
**What it does:** Groups multiple cache operations (`@CacheEvict`, `@CachePut`, `@Cacheable`) on a single method.
**Used in:** `user-service` — `UserProfileCommandService`

```java
@Transactional
@Caching(evict = {
    @CacheEvict(value = "user", key = "'userId_' + #userId"),
    @CacheEvict(value = "user", key = "'email_' + #result.email", condition = "#result != null")
}, put = {
    @CachePut(value = "user", key = "'userId_' + #userId")
})
public UserProfileResponseDto updateProfile(Long userId, UpdateProfileRequestDto dto) { ... }
```

---

## 8. AOP (Aspect-Oriented Programming)

### `@Aspect`
**Package:** `org.aspectj.lang.annotation`
**What it does:** Marks a class as an AOP aspect that can intercept method executions.
**Used in:** `auth-service` — `LoggingAspect`

```java
@Aspect
@Component
@Slf4j
public class LoggingAspect { ... }
```

---

### `@Pointcut`
**Package:** `org.aspectj.lang.annotation`
**What it does:** Defines which methods the aspect should intercept using an expression pattern.
**Used in:** `auth-service` — `LoggingAspect`

```java
@Pointcut("within(com.skillsync..controller..*) || within(com.skillsync..service..*)")
public void applicationPackagePointcut() {}
```

---

### `@Around`
**Package:** `org.aspectj.lang.annotation`
**What it does:** Intercepts method execution completely. Can run logic BEFORE and AFTER the method, and even prevent it from running.
**Used in:** `auth-service` — `LoggingAspect`

```java
@Around("applicationPackagePointcut()")
public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
    log.info("Enter: {}.{}() with argument[s] = {}", ...);
    Object result = joinPoint.proceed();
    log.info("Exit: {}.{}() with result = {}", ...);
    return result;
}
```

---

### `@AfterThrowing`
**Package:** `org.aspectj.lang.annotation`
**What it does:** Runs ONLY after a method throws an exception. Used for centralized error logging.
**Used in:** `auth-service` — `LoggingAspect`

```java
@AfterThrowing(pointcut = "applicationPackagePointcut()", throwing = "e")
public void logAfterThrowing(JoinPoint joinPoint, Throwable e) {
    log.error("Exception in {}.{}() with cause = {}", ...);
}
```

---

## 9. Swagger / OpenAPI Documentation

### `@Tag`
**Package:** `io.swagger.v3.oas.annotations.tags`
**What it does:** Groups controller endpoints under a named section in the Swagger UI.
**Used in:** All controllers

```java
@Tag(name = "Authentication", description = "User authentication and token management")
@Tag(name = "User Profile", description = "User profile management and retrieval")
@Tag(name = "Mentor Management", description = "Mentor profile and application management")
@Tag(name = "Session Management", description = "Session request and management operations")
@Tag(name = "Skill Management", description = "Skill CRUD and search operations")
@Tag(name = "Review Management", description = "Mentor reviews and ratings")
@Tag(name = "Notification Management", description = "User notifications and preferences")
@Tag(name = "Messages", description = "Endpoints for sending and retrieving messages")
@Tag(name = "Group Management", description = "Learning group creation and membership management")
@Tag(name = "Payment Saga", description = "Orchestration-based Saga for session payments via Razorpay")
```

---

### `@Operation`
**Package:** `io.swagger.v3.oas.annotations`
**What it does:** Describes a single API endpoint — its summary and description in Swagger docs.
**Used in:** All controller methods

```java
@Operation(summary = "Login user", description = "Authenticate user with email and password")
public ResponseEntity<AuthResponse> login(...) { ... }
```

---

### `@ApiResponses` / `@ApiResponse`
**Package:** `io.swagger.v3.oas.annotations.responses`
**What it does:** Documents the possible HTTP response codes and their descriptions for a Swagger endpoint.
**Used in:** All controller methods

```java
@ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Login successful, JWT token provided"),
    @ApiResponse(responseCode = "400", description = "Invalid credentials"),
    @ApiResponse(responseCode = "401", description = "Unauthorized")
})
```

---

### `@Parameter`
**Package:** `io.swagger.v3.oas.annotations`
**What it does:** Documents or hides a method parameter in Swagger. `hidden = true` hides gateway-injected headers from docs.
**Used in:** `UserProfileController`, `MentorController`, `SessionController`, etc.

```java
@Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles
```

---

## 10. Lombok (Boilerplate Reduction)

### `@Data`
**Package:** `lombok`
**What it does:** Generates `@Getter`, `@Setter`, `@ToString`, `@EqualsAndHashCode`, and `@RequiredArgsConstructor` all at once.
**Used in:** All DTOs, event classes, and entity classes

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto { ... }
```

---

### `@Getter` / `@Setter`
**Package:** `lombok`
**What it does:** Generates getter/setter methods for all fields in the class.
**Used in:** `auth-service` — `User` entity (uses these instead of `@Data` to avoid issues with JPA proxies)

```java
@Getter
@Setter
public class User extends Auditable { ... }
```

---

### `@NoArgsConstructor`
**Package:** `lombok`
**What it does:** Generates a no-argument constructor. Required by JPA for entity instantiation.
**Used in:** All entities and DTOs

---

### `@AllArgsConstructor`
**Package:** `lombok`
**What it does:** Generates a constructor with parameters for all fields.
**Used in:** All entities and DTOs

---

### `@RequiredArgsConstructor`
**Package:** `lombok`
**What it does:** Generates a constructor for all `final` fields. Enables constructor-based dependency injection WITHOUT `@Autowired`.
**Used in:** Almost every service, controller, mapper, listener, and publisher class

```java
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;  // Auto-injected
    private final JwtUtil jwtUtil;                 // Auto-injected
    private final PasswordEncoder passwordEncoder; // Auto-injected
}
```

---

### `@Builder`
**Package:** `lombok`
**What it does:** Generates a builder pattern API for constructing objects fluently.
**Used in:** `User`, `MentorProfile`, `Session`, `Review`, `Notification`, `PaymentSaga`, `ErrorResponse`, `PageResponse`, `ApiResponse`, `MessageResponseDTO`, etc.

```java
MentorProfile profile = MentorProfile.builder()
    .userId(userId)
    .specialization(request.getSpecialization())
    .hourlyRate(request.getHourlyRate())
    .build();
```

---

### `@Builder.Default`
**Package:** `lombok`
**What it does:** Sets a default value for a field when using `@Builder`. Without it, builder would set the field to `null`.
**Used in:** `auth-service` — `User`

```java
@Builder.Default
private AuthProvider authProvider = AuthProvider.LOCAL;

@Builder.Default
private Boolean isActive = true;
```

---

### `@Slf4j`
**Package:** `lombok.extern.slf4j`
**What it does:** Generates a `private static final Logger log = LoggerFactory.getLogger(...)` field for the class.
**Used in:** Almost every class — controllers, services, listeners, configs, mappers, filters

```java
@Slf4j
public class AuthServiceImpl {
    // Can now use: log.info("User {} logged in", userId);
}
```

---

### `@EqualsAndHashCode`
**Package:** `lombok`
**What it does:** Generates `equals()` and `hashCode()` methods. `callSuper = true` includes parent class fields.
**Used in:** `user-service` — `UserProfile`

```java
@Data
@EqualsAndHashCode(callSuper = true)
public class UserProfile extends Auditable { ... }
```

---

## 11. Jakarta Validation (Bean Validation)

### `@Valid`
**Package:** `jakarta.validation`
**What it does:** Triggers validation of the annotated `@RequestBody` object. Combined with constraints on DTO fields.
**Used in:** All controller methods that accept request bodies

```java
public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) { ... }
```

---

### `@NotNull`
**Package:** `jakarta.validation.constraints`
**What it does:** Field must not be `null`.
**Used in:** DTOs — `RequestSessionRequestDto`, `SubmitReviewRequestDto`, `UpdateProfileRequestDto`, `StartSagaRequest`, `VerifyPaymentRequest`, `RefundRequest`

```java
@NotNull(message = "Mentor ID is required")
private Long mentorId;
```

---

### `@NotBlank`
**Package:** `jakarta.validation.constraints`
**What it does:** Field must not be `null` AND must contain at least one non-whitespace character. For strings only.
**Used in:** `RegisterRequest`, `LoginRequest`, `UpdateProfileRequestDto`, `CreateSkillRequestDto`, `BlockUserRequest`, `VerifyPaymentRequest`

```java
@NotBlank(message = "Email is required")
@Email(message = "Invalid email format")
String email
```

---

### `@Size`
**Package:** `jakarta.validation.constraints`
**What it does:** Field length must be within the specified `min`/`max` bounds.
**Used in:** `RegisterRequest`, `UpdateProfileRequestDto`, `CreateSkillRequestDto`, `SubmitReviewRequestDto`

```java
@Size(min = 2, max = 50, message = "Username must be between 2 and 50 characters")
private String username;

@Size(min = 6, message = "Password must be at least 6 characters")
String password
```

---

### `@Email`
**Package:** `jakarta.validation.constraints`
**What it does:** Validates that the string is a well-formed email address.
**Used in:** `auth-service` — `RegisterRequest`

```java
@Email(message = "Invalid email format")
String email
```

---

### `@Min` / `@Max`
**Package:** `jakarta.validation.constraints`
**What it does:** Numeric field must be greater/less than or equal to the specified value.
**Used in:** `session-service` — `RequestSessionRequestDto`, `review-service` — `SubmitReviewRequestDto`, `payment-gateway` — `StartSagaRequest`

```java
@Min(value = 15, message = "Minimum duration is 15 minutes")
@Max(value = 240, message = "Maximum duration is 240 minutes")
private Integer durationMinutes;

@Min(value = 1, message = "Rating must be between 1 and 5")
@Max(value = 5, message = "Rating must be between 1 and 5")
private Integer rating;
```

---

## 12. Jackson (JSON Serialization)

### `@JsonIgnoreProperties`
**Package:** `com.fasterxml.jackson.annotation`
**What it does:** Ignores unknown/extra JSON properties during deserialization. Prevents errors when consuming DTOs from other services that may have new fields.
**Used in:** `notification-service` — `UserProfileResponse`, `UserDTO`; `payment-gateway` — `SessionDto`, `MentorRateDto`

```java
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserProfileResponse { ... }

@JsonIgnoreProperties(ignoreUnknown = true)
public record SessionDto(Long id, Long learnerId, Long mentorId, ...) {}
```

---

## 13. Hibernate-Specific

### `@CreationTimestamp`
**Package:** `org.hibernate.annotations`
**What it does:** Automatically sets the field to the current timestamp when the entity is first persisted. Hibernate-specific alternative to `@PrePersist`.
**Used in:** `auth-service` — `User`

```java
@CreationTimestamp
@Column(name = "created_at", nullable = false, updatable = false)
private LocalDateTime createdAt;
```

---

### `@UpdateTimestamp`
**Package:** `org.hibernate.annotations`
**What it does:** Automatically updates the field to the current timestamp whenever the entity is modified.
**Used in:** `auth-service` — `User`

```java
@UpdateTimestamp
@Column(name = "updated_at")
private LocalDateTime updatedAt;
```

---

## 14. Testing Annotations

> [!NOTE]
> These annotations are used in the `src/test/java` directories across all services.

### `@SpringBootTest`
**Package:** `org.springframework.boot.test.context`
**What it does:** Loads the full Spring application context for integration tests.

### `@WebMvcTest`
**Package:** `org.springframework.boot.test.autoconfigure.web.servlet`
**What it does:** Loads only the web layer (controllers + filters) for lightweight slice tests.

### `@MockBean`
**Package:** `org.springframework.boot.test.mock.mockito`
**What it does:** Replaces a bean in the Spring context with a Mockito mock for testing.

### `@ActiveProfiles`
**Package:** `org.springframework.test.context`
**What it does:** Activates a specific Spring profile (`test`) for the test class.

### `@ExtendWith(MockitoExtension.class)`
**Package:** `org.junit.jupiter.api`
**What it does:** Enables Mockito annotations (`@Mock`, `@InjectMocks`) in JUnit 5 tests.

### `@Mock` / `@InjectMocks`
**Package:** `org.mockito`
**What it does:** `@Mock` creates a mock object; `@InjectMocks` creates the class under test and injects all mocks into it.

### `@Test`
**Package:** `org.junit.jupiter.api`
**What it does:** Marks a method as a JUnit 5 test case.

### `@BeforeEach` / `@AfterEach`
**Package:** `org.junit.jupiter.api`
**What it does:** Runs setup/teardown logic before/after each test method.

### `@ComponentScan.Filter`
**Package:** `org.springframework.context.annotation`
**What it does:** Excludes specific beans from scanning during `@WebMvcTest` to isolate the controller layer from filters.

```java
@WebMvcTest(value = UserProfileController.class,
    excludeAutoConfiguration = { SecurityAutoConfiguration.class },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = { GatewayRequestFilter.class }
    ))
```

---

## Summary Table

| Category | Annotations | Count |
|---|---|---|
| **Spring Boot Core** | `@SpringBootApplication`, `@Configuration`, `@Bean`, `@ConfigurationProperties`, `@Value`, `@Component`, `@Service`, `@Repository`, `@Order` | 9 |
| **Spring Web / REST** | `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`, `@RequestBody`, `@PathVariable`, `@RequestParam`, `@RequestHeader`, `@CookieValue`, `@ResponseStatus`, `@ControllerAdvice`, `@RestControllerAdvice`, `@ExceptionHandler` | 16 |
| **Spring Data / JPA** | `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`, `@Enumerated`, `@UniqueConstraint`, `@Index`, `@PrePersist`, `@PreUpdate`, `@MappedSuperclass`, `@EntityListeners`, `@EnableJpaAuditing`, `@CreatedBy`, `@LastModifiedBy`, `@Query`, `@Transactional` | 17 |
| **Spring Cloud** | `@EnableDiscoveryClient`, `@EnableEurekaServer`, `@EnableConfigServer`, `@EnableFeignClients`, `@FeignClient` | 5 |
| **Spring Security** | `@EnableWebSecurity`, `@SecurityRequirement` | 2 |
| **RabbitMQ** | `@RabbitListener` | 1 |
| **Caching** | `@EnableCaching`, `@CacheConfig`, `@Cacheable`, `@CacheEvict`, `@CachePut`, `@Caching` | 6 |
| **AOP** | `@Aspect`, `@Pointcut`, `@Around`, `@AfterThrowing` | 4 |
| **Swagger / OpenAPI** | `@Tag`, `@Operation`, `@ApiResponses`, `@ApiResponse`, `@Parameter` | 5 |
| **Lombok** | `@Data`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor`, `@Builder`, `@Builder.Default`, `@Slf4j`, `@EqualsAndHashCode` | 10 |
| **Jakarta Validation** | `@Valid`, `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Min`, `@Max` | 7 |
| **Jackson** | `@JsonIgnoreProperties` | 1 |
| **Hibernate** | `@CreationTimestamp`, `@UpdateTimestamp` | 2 |
| **Testing** | `@SpringBootTest`, `@WebMvcTest`, `@MockBean`, `@ActiveProfiles`, `@ExtendWith`, `@Mock`, `@InjectMocks`, `@Test`, `@BeforeEach`, `@AfterEach`, `@ComponentScan.Filter` | 11 |
| **Total** | | **96** |

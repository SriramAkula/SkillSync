# SkillSync — Annotation Documentation

This document serves as a comprehensive guide to the Java annotations used across the SkillSync microservices. Annotations are grouped by their functional area.

---

## 🏗️ Project & Configuration
Standard Spring Boot and core framework annotations used to define the application shell and configuration.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@SpringBootApplication` | `AuthServiceApplication.java` | Marks the main class of a Spring Boot application. Combines `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. |
| `@Configuration` | `SecurityConfig.java` | Indicates that a class declares one or more `@Bean` methods and may be processed by the Spring container to generate bean definitions. |
| `@Bean` | `RabbitMQConfig.java` | Indicates that a method produces a bean to be managed by the Spring container. |
| `@Component` | `JwtAuthenticationFilter.java` | Generic stereotype for any Spring-managed component (auto-detected via scanning). |
| `@Service` | `SessionServiceImpl.java` | Specialization of `@Component` for service-layer classes containing business logic. |
| `@Repository` | `UserRepository.java` | Specialization of `@Component` for the persistence layer; enables automatic exception translation. |
| `@Value` | `JwtUtil.java` | Injects values from properties files (e.g., `${jwt.secret}`). |
| `@ConfigurationProperties` | `MinioConfig.java` | Binds external configuration properties (like `minio.*`) to a Java object. |
| `@PostConstruct` | `AuditService.java` | Method called once after dependency injection is complete. |

---

## 🧱 Lombok (Boilerplate Reduction)
Used to reduce repetitive Java code like getters, setters, and constructors.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@Data` | `UserDto.java` | Combines `@Getter`, `@Setter`, `@ToString`, `@EqualsAndHashCode`, and `@RequiredArgsConstructor`. |
| `@Getter` / `@Setter` | `BaseEntity.java` | Generates getter and setter methods for fields. |
| `@NoArgsConstructor` | `Session.java` | Generates a constructor with no parameters (required by JPA). |
| `@AllArgsConstructor` | `ApiResponse.java` | Generates a constructor with one parameter for every field. |
| `@RequiredArgsConstructor`| `SessionController.java` | Generates a constructor for all `final` fields (used for Constructor Injection). |
| `@Builder` | `PaymentSaga.java` | Implements the Builder pattern for fluent object creation. |
| `@Slf4j` | `MentorServiceImpl.java` | Injects a Logback `Logger` instance named `log`. |

---

## 🌐 Spring Web (REST Controllers)
Annotations used to define RESTful APIs and handle HTTP traffic.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@RestController` | `UserController.java` | Combines `@Controller` and `@ResponseBody`; marks the class as a REST entry point. |
| `@RequestMapping` | `MentorController.java` | Maps web requests to specific handler classes or methods. |
| `@GetMapping` | `SkillController.java` | Shortcut for `@RequestMapping(method = RequestMethod.GET)`. |
| `@PostMapping` | `AuthController.java` | Shortcut for `@RequestMapping(method = RequestMethod.POST)`. |
| `@PutMapping` | `SessionController.java` | Shortcut for `@RequestMapping(method = RequestMethod.PUT)`. |
| `@DeleteMapping` | `GroupController.java` | Shortcut for `@RequestMapping(method = RequestMethod.DELETE)`. |
| `@PathVariable` | `MentorController.java` | Binds a URI template variable (e.g., `/{id}`) to a method parameter. |
| `@RequestParam` | `SkillController.java` | Binds query parameters (e.g., `?page=0`) to a method parameter. |
| `@RequestBody` | `LoginRequest.java` | Deserializes the HTTP request body (JSON) into a Java object. |
| `@RequestHeader` | `MentorController.java` | Binds an HTTP header (e.g., `X-User-Id`) to a method parameter. |
| `@ResponseStatus` | `GlobalErrorHandler.java` | Marks a method or exception with a specific HTTP status code (e.g., `404 NOT_FOUND`). |
| `@RestControllerAdvice` | `GlobalErrorHandler.java` | Allows handling exceptions across the whole application in one global component. |
| `@ExceptionHandler` | `GlobalErrorHandler.java` | Defines a method to handle a specific exception type. |

---

## 🗄️ Spring Data JPA (Persistence)
Annotations used to map Java objects to MySQL database tables.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@Entity` | `User.java` | Specifies that the class is a JPA entity mapped to a DB table. |
| `@Table` | `MentorProfile.java` | Specifies the name and constraints (like `UNIQUE`) of the database table. |
| `@Id` | `BaseEntity.java` | Specifies the primary key of the entity. |
| `@GeneratedValue` | `BaseEntity.java` | Defines the strategy for primary key generation (e.g., `IDENTITY`). |
| `@Column` | `PaymentSaga.java` | Specifies the mapping between a field and a database column. |
| `@Enumerated` | `Session.java` | Maps a Java Enum to a database column (uses `EnumType.STRING`). |
| `@Transactional` | `SagaOrchestrator.java` | Wraps a method in a database transaction; rolls back on unchecked exceptions. |
| `@Query` | `SessionRepository.java` | Defines a custom SQL or JPQL query for a repository method. |
| `@Modifying` | `UserRepository.java` | Indicates that a query method modifies the database (INSERT, UPDATE, DELETE). |
| `@CreationTimestamp` | `BaseEntity.java` | Automatically sets the field to the current timestamp when the entity is first saved. |
| `@UpdateTimestamp` | `BaseEntity.java` | Automatically updates the field to the current timestamp on every modification. |
| `@MappedSuperclass` | `BaseEntity.java` | Designates a class whose mapping information is applied to the entities that inherit from it. |

---

## ✅ Validation (Jakarta Bean Validation)
Used to enforce constraints on incoming data.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@Valid` | `AuthController.java` | Triggers validation of a nested object or request body. |
| `@NotNull` | `ApplyMentorRequest.java` | Ensures the field is not `null`. |
| `@NotBlank` | `LoginRequest.java` | Ensures a string is not `null` and has a length > 0 (ignoring whitespace). |
| `@Email` | `RegisterRequest.java` | Validates that a string follows a valid email format. |
| `@Size` | `UserDto.java` | Constrains a string or collection to a specific size range. |
| `@Min` / `@Max` | `SkillDto.java` | Constrains numeric values to a minimum or maximum. |

---

## ☁️ Spring Cloud (Microservices)
Annotations for service discovery, configuration, and inter-service communication.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@EnableDiscoveryClient` | `ApiGatewayApp.java` | Registers the service with Eureka Server. |
| `@EnableConfigServer` | `ConfigServerApp.java` | Turns the application into a Spring Cloud Config Server. |
| `@EnableEurekaServer` | `EurekaServerApp.java` | Turns the application into a Netflix Eureka Service Registry. |
| `@EnableFeignClients` | `SessionServiceApp.java` | Enables scanning for interfaces annotated with `@FeignClient`. |
| `@FeignClient` | `UserClient.java` | Declares a REST client for inter-service calls (e.g., Session → User). |

---

## 🛡️ Resilience & Caching
Used for fault tolerance and performance optimization.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@CircuitBreaker` | `SagaOrchestrator.java` | Implements the Circuit Breaker pattern (Resilience4j) to prevent cascading failures. |
| `@Retry` | `SagaOrchestrator.java` | Automatically retries a failed operation a specified number of times. |
| `@Cacheable` | `UserServiceImpl.java` | Caches the result of a method in Redis using a specific key. |
| `@CacheEvict` | `UserServiceImpl.java` | Removes a specific entry from the Redis cache (used on updates/deletes). |
| `@EnableCaching` | `RedisConfig.java` | Enables Spring's annotation-driven cache management capability. |

---

## 🕒 Auditing & Lifecycle
Annotations for tracking entity creation/modification and JPA lifecycle events.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@EnableJpaAuditing` | `AuditConfig.java` | Enables Spring Data JPA's auditing infrastructure. |
| `@EntityListeners` | `BaseEntity.java` | Specifies the listener class (e.g., `AuditingEntityListener`) for lifecycle events. |
| `@CreatedBy` / `@LastModifiedBy` | `BaseEntity.java` | Automatically populates the field with the user who created/modified the record. |
| `@PrePersist` / `@PreUpdate` | `AuditLogListener.java` | Hooks into the JPA lifecycle to perform logic before an entity is saved or updated. |

---

## 🔡 Serialization (Jackson)
Used to control how Java objects are converted to and from JSON.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@JsonProperty` | `UserDto.java` | Defines the name of the JSON property (e.g., `first_name`). |
| `@JsonFormat` | `SessionDto.java` | Specifies the format for date/time fields (e.g., `yyyy-MM-dd HH:mm`). |
| `@JsonIgnoreProperties` | `Group.java` | Instructs Jackson to ignore unknown properties during deserialization. |

---

## ✉️ Messaging (RabbitMQ)
Used for asynchronous event-driven communication.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@RabbitListener` | `NotificationConsumer.java`| Marks a method as a listener for messages on a specific RabbitMQ queue. |

---

## 📖 Documentation (OpenAPI/Swagger)
Used to generate the interactive API documentation.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@Tag` | `AuthController.java` | Groups related endpoints together in the Swagger UI. |
| `@Operation` | `MentorController.java` | Provides a summary and description for a specific API endpoint. |
| `@Parameter` | `MentorController.java` | Describes a method parameter (used to hide internal headers like `X-User-Id`). |
| `@ApiResponses` | `SessionController.java` | Groups multiple `@ApiResponse` annotations together. |
| `@Schema` | `UserDto.java` | Provides metadata for DTO fields (description, example values). |

---

## 🧪 Testing (JUnit & Mockito)
Annotations used in unit and integration tests.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@Test` | `AuthServiceTest.java` | Marks a method as a test case. |
| `@ExtendWith` | `MentorServiceTest.java` | Integrates a testing framework (e.g., `MockitoExtension`) with JUnit 5. |
| `@Mock` | `AuthServiceTest.java` | Creates a mock instance of a class or interface. |
| `@InjectMocks` | `AuthServiceTest.java` | Injects `@Mock` fields into the tested object automatically. |
| `@SpringBootTest` | `ApiGatewayTests.java` | Loads the full Spring ApplicationContext for integration testing. |
| `@MockBean` | `UserControllerTest.java` | Adds a mock to the Spring ApplicationContext (replaces existing beans). |
| `@BeforeEach` | `AuthServiceTest.java` | Method to run before every individual test case. |
| `@AutoConfigureMockMvc` | `AuthControllerTest.java` | Configures the `MockMvc` instance for testing controllers without a server. |

---

## 🕵️ Security & AOP
Annotations for security rules and Aspect-Oriented Programming.

| Annotation | Example Usage | Purpose |
|------------|---------------|---------|
| `@EnableWebSecurity` | `SecurityConfig.java` | Enables Spring Security's web security support. |
| `@PreAuthorize` | `AdminController.java` | (If used) Enforces security rules using SpEL before a method is invoked. |
| `@Aspect` | `LoggingAspect.java` | Marks a class as an Aspect (containing cross-cutting concerns). |
| `@Around` | `LoggingAspect.java` | Advice that surrounds a method execution (can change return values). |
| `@Pointcut` | `LoggingAspect.java` | Defines where an Aspect's advice should be applied. |

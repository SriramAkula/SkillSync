package com.skillsync.authservice.publisher;

import com.skillsync.authservice.audit.AuditLog;
import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.config.DataInitializer;
import com.skillsync.authservice.dto.response.ApiResponse;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.event.UserCreatedEvent;
import com.skillsync.authservice.event.UserUpdatedEvent;
import com.skillsync.authservice.mapper.AuthMapper;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.SecurityExceptionHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;



import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MiscCoverageTest {

    // ─── AuthEventPublisher ───────────────────────────────────────

    @Mock private RabbitTemplate rabbitTemplate;
    @InjectMocks private AuthEventPublisher authEventPublisher;

    @Test
    void publishUserCreated_shouldSendToRabbit() {
        UserCreatedEvent event = new UserCreatedEvent(1L, "test@example.com", "Test", "test", "ROLE_LEARNER", System.currentTimeMillis());
        doNothing().when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        authEventPublisher.publishUserCreated(event);

        verify(rabbitTemplate).convertAndSend(anyString(), anyString(), eq(event));
    }

    @Test
    void publishUserCreated_shouldThrow_whenRabbitFails() {
        UserCreatedEvent event = new UserCreatedEvent(1L, "test@example.com", "Test", "test", "ROLE_LEARNER", System.currentTimeMillis());
        doThrow(new RuntimeException("RabbitMQ down")).when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        assertThatThrownBy(() -> authEventPublisher.publishUserCreated(event))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void publishUserUpdated_shouldSendToRabbit() {
        UserUpdatedEvent event = new UserUpdatedEvent(1L, "test@example.com", "Test", "test", "ROLE_LEARNER", true, System.currentTimeMillis());
        doNothing().when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        authEventPublisher.publishUserUpdated(event);

        verify(rabbitTemplate).convertAndSend(anyString(), anyString(), eq(event));
    }

    @Test
    void publishUserUpdated_shouldThrow_whenRabbitFails() {
        UserUpdatedEvent event = new UserUpdatedEvent(1L, "test@example.com", "Test", "test", "ROLE_LEARNER", true, System.currentTimeMillis());
        doThrow(new RuntimeException("RabbitMQ down")).when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        assertThatThrownBy(() -> authEventPublisher.publishUserUpdated(event))
                .isInstanceOf(RuntimeException.class);
    }

    // ─── SecurityExceptionHandler ─────────────────────────────────

    @Test
    void securityExceptionHandler_shouldReturn401_forAuthException() throws Exception {
        SecurityExceptionHandler handler = new SecurityExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.commence(request, response, new AuthenticationException("Unauthorized") {});

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).contains("application/json");
    }

    @Test
    void securityExceptionHandler_shouldReturn403_forAccessDeniedException() throws Exception {
        SecurityExceptionHandler handler = new SecurityExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.handle(request, response, new AccessDeniedException("Forbidden"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).contains("application/json");
    }

    // ─── DataInitializer ─────────────────────────────────────────

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserServiceClient userServiceClient;
    @InjectMocks private DataInitializer dataInitializer;

    @Test
    void dataInitializer_shouldCreateAdmins_whenNotExist() throws Exception {
        lenient().when(userRepository.existsByEmail(any())).thenReturn(false);
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("encodedPass");
        lenient().when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        dataInitializer.run();

        verify(userRepository, times(2)).save(any(User.class));
    }

    @Test
    void dataInitializer_shouldSkip_whenAdminsAlreadyExist() throws Exception {
        lenient().when(userRepository.existsByEmail(any())).thenReturn(true);

        dataInitializer.run();

        verify(userRepository, never()).save(any());
    }

    @Test
    void dataInitializer_shouldStillSucceed_whenUserServiceFails() throws Exception {
        lenient().when(userRepository.existsByEmail(any())).thenReturn(false);
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("encodedPass");
        lenient().when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        doThrow(new RuntimeException("Feign error")).when(userServiceClient).createProfile(any());

        assertThatCode(() -> dataInitializer.run()).doesNotThrowAnyException();
    }

    // ─── AuthMapper ───────────────────────────────────────────────

    @Test
    void authMapper_toUser_shouldMapCorrectly() {
        AuthMapper mapper = new AuthMapper();
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode("password123")).thenReturn("encodedPass");

        com.skillsync.authservice.dto.request.RegisterRequest request =
                new com.skillsync.authservice.dto.request.RegisterRequest("test@example.com", "password123");

        User user = mapper.toUser(request, encoder);

        assertThat(user.getEmail()).isEqualTo("test@example.com");
        assertThat(user.getPassword()).isEqualTo("encodedPass");
        assertThat(user.getIsActive()).isTrue();
    }



    // ─── UserCreatedEvent ─────────────────────────────────────────

    @Test
    void userCreatedEvent_shouldSetAndGetAllFields() {
        UserCreatedEvent event = new UserCreatedEvent();
        event.setUserId(1L);
        event.setEmail("test@example.com");
        event.setName("Test User");
        event.setUsername("test.user");
        event.setRole("ROLE_LEARNER");
        event.setCreatedAtMillis(12345L);

        assertThat(event.getUserId()).isEqualTo(1L);
        assertThat(event.getEmail()).isEqualTo("test@example.com");
        assertThat(event.getName()).isEqualTo("Test User");
        assertThat(event.getUsername()).isEqualTo("test.user");
        assertThat(event.getRole()).isEqualTo("ROLE_LEARNER");
        assertThat(event.getCreatedAtMillis()).isEqualTo(12345L);
    }

    // ─── UserUpdatedEvent ─────────────────────────────────────────

    @Test
    void userUpdatedEvent_shouldSetAndGetAllFields() {
        UserUpdatedEvent event = new UserUpdatedEvent();
        event.setUserId(2L);
        event.setEmail("updated@example.com");
        event.setName("Updated User");
        event.setUsername("updated.user");
        event.setRole("ROLE_MENTOR");
        event.setIsActive(false);
        event.setUpdatedAtMillis(99999L);

        assertThat(event.getUserId()).isEqualTo(2L);
        assertThat(event.getEmail()).isEqualTo("updated@example.com");
        assertThat(event.getName()).isEqualTo("Updated User");
        assertThat(event.getUsername()).isEqualTo("updated.user");
        assertThat(event.getRole()).isEqualTo("ROLE_MENTOR");
        assertThat(event.getIsActive()).isFalse();
        assertThat(event.getUpdatedAtMillis()).isEqualTo(99999L);
    }

    // ─── AuditLog ─────────────────────────────────────────────────

    @Test
    void auditLog_shouldSetAndGetAllFields() {
        AuditLog log = new AuditLog();
        log.setEntityName("User");
        log.setEntityId(1L);
        log.setAction("LOGIN");
        log.setPerformedBy("1");
        log.setDetails("email=test@example.com");

        assertThat(log.getEntityName()).isEqualTo("User");
        assertThat(log.getEntityId()).isEqualTo(1L);
        assertThat(log.getAction()).isEqualTo("LOGIN");
        assertThat(log.getPerformedBy()).isEqualTo("1");
        assertThat(log.getDetails()).isEqualTo("email=test@example.com");
    }

    // ─── ApiResponse ─────────────────────────────────────────────

    @Test
    void apiResponse_threeArgConstructor_shouldWork() {
        ApiResponse<String> response = new ApiResponse<>("Success", "data", 200);
        assertThat(response.getMessage()).isEqualTo("Success");
        assertThat(response.getData()).isEqualTo("data");
        assertThat(response.getStatusCode()).isEqualTo(200);
    }

    @Test
    void apiResponse_twoArgConstructor_shouldWork() {
        ApiResponse<Void> response = new ApiResponse<>("OK", 200);
        assertThat(response.getMessage()).isEqualTo("OK");
        assertThat(response.getStatusCode()).isEqualTo(200);
    }
}

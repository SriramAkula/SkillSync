package com.skillsync.authservice.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.skillsync.authservice.audit.AuditService;
import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.dto.request.LoginRequest;
import com.skillsync.authservice.dto.request.RegisterRequest;
import com.skillsync.authservice.dto.response.AuthResponse;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.publisher.AuthEventPublisher;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.JwtUtil;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private AuthEventPublisher eventPublisher;

    @Mock
    private OtpService otpService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest("test@example.com", "password123");
        loginRequest = new LoginRequest("test@example.com", "password123");
        user = new User("test@example.com", "encodedPassword", "test.example.com", "ROLE_LEARNER");
        user.setId(1L);
    }

    @Test
    void register_ShouldReturnAuthResponse_WhenSuccessful() {
        // Arrange
        when(otpService.isEmailVerified(anyString())).thenReturn(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtUtil.generateToken(any(), anyString(), any())).thenReturn("mockToken");

        // Act
        AuthResponse response = authService.register(registerRequest);

        // Assert
        assertNotNull(response);
        assertEquals("mockToken", response.token());
        assertEquals(Collections.singletonList("ROLE_LEARNER"), response.roles());
        verify(userRepository, times(1)).save(any(User.class));
        verify(eventPublisher, times(1)).publishUserCreated(any());
        verify(userServiceClient, times(1)).createProfile(any());
    }

    @Test
    void register_ShouldThrowException_WhenEmailExists() {
        // Arrange
        when(otpService.isEmailVerified(anyString())).thenReturn(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.register(registerRequest));
        assertEquals("Email already exists", exception.getMessage());
    }

    @Test
    void register_ShouldSucceed_EvenWhenFeignFails() {
        // Arrange
        when(otpService.isEmailVerified(anyString())).thenReturn(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtUtil.generateToken(any(), anyString(), any())).thenReturn("mockToken");
        doThrow(new RuntimeException("Feign failure")).when(userServiceClient).createProfile(any());

        // Act
        AuthResponse response = authService.register(registerRequest);

        // Assert
        assertNotNull(response);
        assertEquals("mockToken", response.token());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void login_ShouldReturnAuthResponse_WhenCredentialsAreValid() {
        // Arrange
        user.setIsActive(true);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtil.generateToken(any(), anyString(), any())).thenReturn("mockToken");

        // Act
        AuthResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals("mockToken", response.token());
    }

    @Test
    void login_ShouldThrowException_WhenUserNotFound() {
        // Arrange
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void login_ShouldThrowException_WhenInvalidCredentials() {
        // Arrange
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
        assertEquals("Invalid credentials", exception.getMessage());
    }

    @Test
    void login_ShouldThrowException_WhenUserDeactivated() {
        // Arrange
        user.setIsActive(false);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
        assertEquals("Your account has been deactivated. Please contact support.", exception.getMessage());
    }

    @Test
    void refreshToken_ShouldReturnNewToken_WhenRequested() {
        // Arrange
        when(jwtUtil.extractEmail(anyString())).thenReturn("test@example.com");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(any(), anyString(), any())).thenReturn("newToken");

        // Act
        AuthResponse response = authService.refreshToken("oldToken");

        // Assert
        assertNotNull(response);
        assertEquals("newToken", response.token());
    }

    @Test
    void refreshToken_ShouldThrowException_WhenAccountDeactivated() {
        // Arrange
        user.setIsActive(false);
        when(jwtUtil.extractEmail(anyString())).thenReturn("test@example.com");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.refreshToken("oldToken"));
        assertEquals("Session invalid: Account is deactivated.", exception.getMessage());
    }
}

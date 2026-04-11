package com.skillsync.authservice.service;

import com.skillsync.authservice.audit.AuditService;
import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.dto.request.LoginRequest;
import com.skillsync.authservice.dto.request.RegisterRequest;
import com.skillsync.authservice.dto.response.AuthResponse;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.publisher.AuthEventPublisher;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private UserServiceClient userServiceClient;
    @Mock private AuthEventPublisher eventPublisher;
    @Mock private OtpService otpService;
    @Mock private AuditService auditService;

    @InjectMocks private AuthServiceImpl authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User("test@example.com", "encodedPass", "test.example.com", "ROLE_LEARNER");
        user.setId(1L);
        user.setIsActive(true);
    }

    // ─── register ───────────────────────────────────────────────────────────

    @Test
    void register_shouldReturnToken_whenValidRequest() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(otpService.isEmailVerified("test@example.com")).thenReturn(true);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("jwt-token");
        when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("refresh-token");

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.roles()).contains("ROLE_LEARNER");
        verify(userRepository).save(any(User.class));
        verify(eventPublisher).publishUserCreated(any());
    }

    @Test
    void register_shouldThrow_whenEmailNotVerified() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(otpService.isEmailVerified("test@example.com")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email not verified");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(otpService.isEmailVerified("test@example.com")).thenReturn(true);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenUsernameAlreadyExists() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(otpService.isEmailVerified("test@example.com")).thenReturn(true);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Username derived from email already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldStillSucceed_whenEventPublishFails() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(otpService.isEmailVerified(anyString())).thenReturn(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPass");
        when(userRepository.save(any())).thenReturn(user);
        when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("jwt-token");
        when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("refresh-token");
        doThrow(new RuntimeException("RabbitMQ down")).when(eventPublisher).publishUserCreated(any());

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isEqualTo("jwt-token");
    }

    @Test
    void register_shouldStillSucceed_whenFeignClientFails() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(otpService.isEmailVerified(anyString())).thenReturn(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPass");
        when(userRepository.save(any())).thenReturn(user);
        when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("jwt-token");
        when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("refresh-token");
        doThrow(new RuntimeException("Feign error")).when(userServiceClient).createProfile(any());

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isEqualTo("jwt-token");
    }

    // ─── login ───────────────────────────────────────────────────────────────

    @Test
    void login_shouldReturnToken_whenValidCredentials() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPass")).thenReturn(true);
        when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("jwt-token");
        when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("refresh-token");

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.roles()).contains("ROLE_LEARNER");
    }

    @Test
    void login_shouldThrow_whenUserNotFound() {
        LoginRequest request = new LoginRequest("unknown@example.com", "password123");
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void login_shouldThrow_whenAccountDeactivated() {
        user.setIsActive(false);
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    void login_shouldThrow_whenInvalidPassword() {
        LoginRequest request = new LoginRequest("test@example.com", "wrongPass");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPass", "encodedPass")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid password");
    }

    // ─── refreshToken ────────────────────────────────────────────────────────

    @Test
    void refreshToken_shouldReturnNewToken_whenValid() {
        when(jwtUtil.extractEmailIgnoreExpiry("old-token")).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("new-token");
        when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("new-refresh-token");

        AuthResponse response = authService.refreshToken("old-token");

        assertThat(response.token()).isEqualTo("new-token");
        assertThat(response.refreshToken()).isEqualTo("new-refresh-token");
    }

    @Test
    void refreshToken_shouldThrow_whenUserNotFound() {
        when(jwtUtil.extractEmailIgnoreExpiry("bad-token")).thenReturn("ghost@example.com");
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refreshToken("bad-token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void refreshToken_shouldThrow_whenAccountDeactivated() {
        user.setIsActive(false);
        when(jwtUtil.extractEmailIgnoreExpiry("token")).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.refreshToken("token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("deactivated");
    }
    @Test
    void register_shouldHandleUsernameCollisionFallback() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(otpService.isEmailVerified("test@example.com")).thenReturn(true);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        
        // First username 'test' exists
        when(userRepository.existsByUsername("test")).thenReturn(true);
        // Second username 'test.example.com' also exists -> should throw
        when(userRepository.existsByUsername("test.example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Username derived from email already exists");
    }

    @Test
    void register_shouldHandleUsernameCollisionSucceed() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(otpService.isEmailVerified("test@example.com")).thenReturn(true);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("test")).thenReturn(true);
        when(userRepository.existsByUsername("test.example.com")).thenReturn(false); // Success on second try
        when(passwordEncoder.encode(anyString())).thenReturn("p");
        when(userRepository.save(any())).thenReturn(user);
        when(jwtUtil.generateToken(any(), any(), any())).thenReturn("t");
        when(jwtUtil.generateRefreshToken(any(), any(), any())).thenReturn("rt");

        authService.register(request);
        verify(userRepository).existsByUsername("test.example.com");
    }

    @Test
    void login_shouldThrow_whenNotLocalProvider() {
        user.setAuthProvider(com.skillsync.authservice.enums.AuthProvider.GOOGLE);
        LoginRequest request = new LoginRequest("test@example.com", "p");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Please use the corresponding social login button");
    }

    @Test
    void sendForgotPasswordOtp_shouldReturnSilently_whenUserNotFoundOrDeactivated() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());
        authService.sendForgotPasswordOtp("ghost@example.com");
        verify(otpService, never()).sendPasswordResetOtp(any());

        user.setIsActive(false);
        when(userRepository.findByEmail("deactivated@example.com")).thenReturn(Optional.of(user));
        authService.sendForgotPasswordOtp("deactivated@example.com");
        verify(otpService, never()).sendPasswordResetOtp(any());
    }

    @Test
    void resetPassword_shouldThrow_whenAccountDeactivated() {
        when(otpService.isPasswordResetVerified("test@example.com")).thenReturn(true);
        user.setIsActive(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.resetPassword("test@example.com", "newPass"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    void resetPassword_shouldSyncAuthProvider_whenNotLocal() {
        when(otpService.isPasswordResetVerified("test@example.com")).thenReturn(true);
        user.setAuthProvider(com.skillsync.authservice.enums.AuthProvider.GOOGLE);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        authService.resetPassword("test@example.com", "newPass");

        assertThat(user.getAuthProvider()).isEqualTo(com.skillsync.authservice.enums.AuthProvider.LOCAL);
        verify(userRepository).save(user);
    }

    // ─── Otp / Additional ───────────────────────────────────

    @Test
    void sendOtp_shouldSucceed_whenUserDoesNotExist() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        authService.sendOtp("new@example.com");
        verify(otpService).sendOtp("new@example.com");
    }

    @Test
    void sendOtp_shouldThrow_whenUserExists() {
        when(userRepository.existsByEmail("exists@example.com")).thenReturn(true);
        assertThatThrownBy(() -> authService.sendOtp("exists@example.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    void verifyOtp_shouldThrow_whenInvalid() {
        when(otpService.verifyOtp("test@example.com", "123456")).thenReturn(false);
        assertThatThrownBy(() -> authService.verifyOtp("test@example.com", "123456"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid or expired OTP");
    }

    @Test
    void verifyOtp_shouldSucceed_whenValid() {
        when(otpService.verifyOtp("test@example.com", "123456")).thenReturn(true);
        authService.verifyOtp("test@example.com", "123456");
        // verify no exception
    }

    @Test
    void sendForgotPasswordOtp_shouldSucceed_whenUserExists() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        authService.sendForgotPasswordOtp("test@example.com");
        verify(otpService).sendPasswordResetOtp("test@example.com");
    }

    @Test
    void verifyForgotPasswordOtp_shouldThrow_whenInvalid() {
        when(otpService.verifyPasswordResetOtp("test@example.com", "123456")).thenReturn(false);
        assertThatThrownBy(() -> authService.verifyForgotPasswordOtp("test@example.com", "123456"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid or expired OTP");
    }

    @Test
    void resetPassword_shouldThrow_whenOtpNotVerified() {
        when(otpService.isPasswordResetVerified("test@example.com")).thenReturn(false);
        assertThatThrownBy(() -> authService.resetPassword("test@example.com", "newPass"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("OTP not verified");
    }

    @Test
    void resetPassword_shouldThrow_whenUserNotFound() {
        when(otpService.isPasswordResetVerified("test@example.com")).thenReturn(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.resetPassword("test@example.com", "newPass"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }
}

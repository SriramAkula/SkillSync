package com.skillsync.authservice.service;

import com.skillsync.authservice.audit.AuditService;
import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.enums.AuthProvider;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplOtpTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private UserServiceClient userServiceClient;
    @Mock private AuthEventPublisher eventPublisher;
    @Mock private OtpService otpService;
    @Mock private AuditService auditService;

    @InjectMocks private AuthServiceImpl authService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = new User("test@example.com", "encodedPass", "test.example.com", "ROLE_LEARNER");
        activeUser.setId(1L);
        activeUser.setIsActive(true);
    }

    // ─── sendOtp ─────────────────────────────────────────────────

    @Test
    void sendOtp_shouldCallOtpService_whenEmailNotRegistered() {
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());

        authService.sendOtp("new@example.com");

        verify(otpService).sendOtp("new@example.com");
    }

    @Test
    void sendOtp_shouldThrow_whenEmailAlreadyRegisteredWithPassword() {
        activeUser.setAuthProvider(AuthProvider.LOCAL);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authService.sendOtp("test@example.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already registered and has a password set");

        verify(otpService, never()).sendOtp(any());
    }

    @Test
    void sendOtp_shouldSucceed_whenEmailRegisteredAsOAuthUser() {
        activeUser.setAuthProvider(AuthProvider.GOOGLE);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));

        authService.sendOtp("test@example.com");

        verify(otpService).sendOtp("test@example.com");
    }

    // ─── verifyOtp ───────────────────────────────────────────────

    @Test
    void verifyOtp_shouldSucceed_whenOtpValid() {
        when(otpService.verifyOtp("test@example.com", "123456")).thenReturn(true);

        authService.verifyOtp("test@example.com", "123456");

        verify(otpService).verifyOtp("test@example.com", "123456");
    }

    @Test
    void verifyOtp_shouldThrow_whenOtpInvalid() {
        when(otpService.verifyOtp("test@example.com", "000000")).thenReturn(false);

        assertThatThrownBy(() -> authService.verifyOtp("test@example.com", "000000"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid or expired OTP");
    }

    // ─── sendForgotPasswordOtp ───────────────────────────────────

    @Test
    void sendForgotPasswordOtp_shouldSendOtp_whenUserExists() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));

        authService.sendForgotPasswordOtp("test@example.com");

        verify(otpService).sendPasswordResetOtp("test@example.com");
    }

    @Test
    void sendForgotPasswordOtp_shouldSilentlyReturn_whenUserNotFound() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        authService.sendForgotPasswordOtp("ghost@example.com");

        verify(otpService, never()).sendPasswordResetOtp(any());
    }

    @Test
    void sendForgotPasswordOtp_shouldSilentlyReturn_whenAccountDeactivated() {
        activeUser.setIsActive(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));

        authService.sendForgotPasswordOtp("test@example.com");

        verify(otpService, never()).sendPasswordResetOtp(any());
    }

    // ─── verifyForgotPasswordOtp ─────────────────────────────────

    @Test
    void verifyForgotPasswordOtp_shouldSucceed_whenOtpValid() {
        when(otpService.verifyPasswordResetOtp("test@example.com", "654321")).thenReturn(true);

        authService.verifyForgotPasswordOtp("test@example.com", "654321");

        verify(otpService).verifyPasswordResetOtp("test@example.com", "654321");
    }

    @Test
    void verifyForgotPasswordOtp_shouldThrow_whenOtpInvalid() {
        when(otpService.verifyPasswordResetOtp("test@example.com", "000000")).thenReturn(false);

        assertThatThrownBy(() -> authService.verifyForgotPasswordOtp("test@example.com", "000000"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid or expired OTP");
    }

    // ─── resetPassword ───────────────────────────────────────────

    @Test
    void resetPassword_shouldUpdatePassword_whenOtpVerified() {
        when(otpService.isPasswordResetVerified("test@example.com")).thenReturn(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.encode("newPass123")).thenReturn("encodedNewPass");

        authService.resetPassword("test@example.com", "newPass123");

        verify(userRepository).save(argThat(u -> u.getPassword().equals("encodedNewPass")));
        verify(otpService).clearPasswordResetVerification("test@example.com");
    }

    @Test
    void resetPassword_shouldThrow_whenOtpNotVerified() {
        when(otpService.isPasswordResetVerified("test@example.com")).thenReturn(false);

        assertThatThrownBy(() -> authService.resetPassword("test@example.com", "newPass123"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("OTP not verified");

        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_shouldThrow_whenUserNotFound() {
        when(otpService.isPasswordResetVerified("ghost@example.com")).thenReturn(true);
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword("ghost@example.com", "newPass123"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void resetPassword_shouldThrow_whenAccountDeactivated() {
        activeUser.setIsActive(false);
        when(otpService.isPasswordResetVerified("test@example.com")).thenReturn(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authService.resetPassword("test@example.com", "newPass123"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    void resetPassword_shouldSwitchToBothProvider_whenOAuthUser() {
        activeUser.setAuthProvider(AuthProvider.GOOGLE);
        when(otpService.isPasswordResetVerified("test@example.com")).thenReturn(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPass");

        authService.resetPassword("test@example.com", "newPass123");

        verify(userRepository).save(argThat(u -> u.getAuthProvider() == AuthProvider.BOTH));
    }

    // ─── login with OAuth provider ───────────────────────────────

    @Test
    void login_shouldThrow_whenUserIsOAuthProvider() {
        activeUser.setAuthProvider(AuthProvider.GOOGLE);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authService.login(
                new com.skillsync.authservice.dto.request.LoginRequest("test@example.com", "pass")))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("GOOGLE");
    }
}

package com.skillsync.authservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock private RedisTemplate<String, String> redisTemplate;
    @Mock private JavaMailSender mailSender;
    @Mock private ValueOperations<String, String> valueOps;

    @InjectMocks private OtpService otpService;

    // ─── sendOtp ─────────────────────────────────────────────────

    @Test
    void sendOtp_shouldStoreInRedisAndSendEmail() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        otpService.sendOtp("test@example.com");

        verify(valueOps).set(eq("otp:test@example.com"), anyString(), anyLong(), eq(TimeUnit.MINUTES));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    // ─── verifyOtp ───────────────────────────────────────────────

    @Test
    void verifyOtp_shouldReturnTrue_whenOtpMatches() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:test@example.com")).thenReturn("123456");

        boolean result = otpService.verifyOtp("test@example.com", "123456");

        assertThat(result).isTrue();
        verify(redisTemplate).delete("otp:test@example.com");
        verify(valueOps).set(eq("otp:verified:test@example.com"), eq("true"), anyLong(), eq(TimeUnit.MINUTES));
    }

    @Test
    void verifyOtp_shouldReturnFalse_whenOtpExpired() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:test@example.com")).thenReturn(null);

        boolean result = otpService.verifyOtp("test@example.com", "123456");

        assertThat(result).isFalse();
    }

    @Test
    void verifyOtp_shouldReturnFalse_whenOtpWrong() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:test@example.com")).thenReturn("999999");

        boolean result = otpService.verifyOtp("test@example.com", "123456");

        assertThat(result).isFalse();
    }

    // ─── isEmailVerified ─────────────────────────────────────────

    @Test
    void isEmailVerified_shouldReturnTrue_whenVerified() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:verified:test@example.com")).thenReturn("true");

        assertThat(otpService.isEmailVerified("test@example.com")).isTrue();
    }

    @Test
    void isEmailVerified_shouldReturnFalse_whenNotVerified() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:verified:test@example.com")).thenReturn(null);

        assertThat(otpService.isEmailVerified("test@example.com")).isFalse();
    }

    // ─── clearVerification ───────────────────────────────────────

    @Test
    void clearVerification_shouldDeleteKey() {
        otpService.clearVerification("test@example.com");
        verify(redisTemplate).delete("otp:verified:test@example.com");
    }

    // ─── sendPasswordResetOtp ────────────────────────────────────

    @Test
    void sendPasswordResetOtp_shouldStoreInRedisAndSendEmail() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        otpService.sendPasswordResetOtp("test@example.com");

        verify(valueOps).set(eq("otp:pwd:test@example.com"), anyString(), anyLong(), eq(TimeUnit.MINUTES));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    // ─── verifyPasswordResetOtp ──────────────────────────────────

    @Test
    void verifyPasswordResetOtp_shouldReturnTrue_whenOtpMatches() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:pwd:test@example.com")).thenReturn("654321");

        boolean result = otpService.verifyPasswordResetOtp("test@example.com", "654321");

        assertThat(result).isTrue();
        verify(redisTemplate).delete("otp:pwd:test@example.com");
        verify(valueOps).set(eq("otp:pwd-reset:test@example.com"), eq("true"), anyLong(), eq(TimeUnit.MINUTES));
    }

    @Test
    void verifyPasswordResetOtp_shouldReturnFalse_whenExpired() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:pwd:test@example.com")).thenReturn(null);

        assertThat(otpService.verifyPasswordResetOtp("test@example.com", "654321")).isFalse();
    }

    @Test
    void verifyPasswordResetOtp_shouldReturnFalse_whenWrong() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:pwd:test@example.com")).thenReturn("000000");

        assertThat(otpService.verifyPasswordResetOtp("test@example.com", "654321")).isFalse();
    }

    // ─── isPasswordResetVerified ─────────────────────────────────

    @Test
    void isPasswordResetVerified_shouldReturnTrue_whenVerified() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:pwd-reset:test@example.com")).thenReturn("true");

        assertThat(otpService.isPasswordResetVerified("test@example.com")).isTrue();
    }

    @Test
    void isPasswordResetVerified_shouldReturnFalse_whenNotVerified() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("otp:pwd-reset:test@example.com")).thenReturn(null);

        assertThat(otpService.isPasswordResetVerified("test@example.com")).isFalse();
    }

    // ─── clearPasswordResetVerification ──────────────────────────

    @Test
    void clearPasswordResetVerification_shouldDeleteKey() {
        otpService.clearPasswordResetVerification("test@example.com");
        verify(redisTemplate).delete("otp:pwd-reset:test@example.com");
    }
}

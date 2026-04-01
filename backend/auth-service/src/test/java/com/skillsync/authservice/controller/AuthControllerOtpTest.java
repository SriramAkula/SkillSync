package com.skillsync.authservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.authservice.config.DataInitializer;
import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.dto.request.OtpRequest;
import com.skillsync.authservice.dto.request.OtpVerifyRequest;
import com.skillsync.authservice.dto.request.ResetPasswordRequest;
import com.skillsync.authservice.security.JwtUtil;
import com.skillsync.authservice.service.AuthService;
import com.skillsync.authservice.service.OAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = AuthController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    }
)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerOtpTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AuthService authService;
    @MockBean OAuthService oAuthService;
    @MockBean JwtUtil jwtUtil;
    @MockBean DataInitializer dataInitializer;
    @MockBean UserServiceClient userServiceClient;

    // ─── POST /auth/send-otp ──────────────────────────────────────

    @Test
    void sendOtp_shouldReturn200_whenValid() throws Exception {
        doNothing().when(authService).sendOtp("test@example.com");

        mockMvc.perform(post("/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new OtpRequest("test@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP sent to test@example.com"));
    }

    @Test
    void sendOtp_shouldReturn500_whenEmailAlreadyRegistered() throws Exception {
        doThrow(new RuntimeException("Email already registered")).when(authService).sendOtp(anyString());

        mockMvc.perform(post("/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new OtpRequest("test@example.com"))))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void sendOtp_shouldReturn400_whenEmailBlank() throws Exception {
        mockMvc.perform(post("/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    // ─── POST /auth/verify-otp ────────────────────────────────────

    @Test
    void verifyOtp_shouldReturn200_whenValid() throws Exception {
        doNothing().when(authService).verifyOtp("test@example.com", "123456");

        mockMvc.perform(post("/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new OtpVerifyRequest("test@example.com", "123456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verified successfully. You may now register."));
    }

    @Test
    void verifyOtp_shouldReturn500_whenOtpInvalid() throws Exception {
        doThrow(new RuntimeException("Invalid or expired OTP")).when(authService).verifyOtp(anyString(), anyString());

        mockMvc.perform(post("/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new OtpVerifyRequest("test@example.com", "000000"))))
                .andExpect(status().isInternalServerError());
    }

    // ─── POST /auth/forgot-password ───────────────────────────────

    @Test
    void forgotPassword_shouldReturn200_always() throws Exception {
        doNothing().when(authService).sendForgotPasswordOtp("test@example.com");

        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new OtpRequest("test@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If this email is registered, an OTP has been sent."));
    }

    @Test
    void forgotPassword_shouldReturn400_whenEmailBlank() throws Exception {
        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    // ─── POST /auth/verify-forgot-password ────────────────────────

    @Test
    void verifyForgotPasswordOtp_shouldReturn200_whenValid() throws Exception {
        doNothing().when(authService).verifyForgotPasswordOtp("test@example.com", "654321");

        mockMvc.perform(post("/auth/verify-forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new OtpVerifyRequest("test@example.com", "654321"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP verified. You may now reset your password."));
    }

    @Test
    void verifyForgotPasswordOtp_shouldReturn500_whenOtpInvalid() throws Exception {
        doThrow(new RuntimeException("Invalid or expired OTP"))
                .when(authService).verifyForgotPasswordOtp(anyString(), anyString());

        mockMvc.perform(post("/auth/verify-forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new OtpVerifyRequest("test@example.com", "000000"))))
                .andExpect(status().isInternalServerError());
    }

    // ─── POST /auth/reset-password ────────────────────────────────

    @Test
    void resetPassword_shouldReturn200_whenValid() throws Exception {
        doNothing().when(authService).resetPassword("test@example.com", "newPass123");

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ResetPasswordRequest("test@example.com", "newPass123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully. Please login with your new password."));
    }

    @Test
    void resetPassword_shouldReturn500_whenOtpNotVerified() throws Exception {
        doThrow(new RuntimeException("OTP not verified"))
                .when(authService).resetPassword(anyString(), anyString());

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ResetPasswordRequest("test@example.com", "newPass123"))))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void resetPassword_shouldReturn400_whenPasswordTooShort() throws Exception {
        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ResetPasswordRequest("test@example.com", "abc"))))
                .andExpect(status().isBadRequest());
    }
}

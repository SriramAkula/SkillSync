package com.skillsync.authservice.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.authservice.dto.request.*;
import com.skillsync.authservice.dto.response.ApiResponse;
import com.skillsync.authservice.dto.response.AuthResponse;
import com.skillsync.authservice.service.AuthService;
import com.skillsync.authservice.service.OAuthService;
import com.skillsync.authservice.security.JwtUtil;
import com.skillsync.authservice.config.DataInitializer;
import com.skillsync.authservice.client.UserServiceClient;
import org.springframework.http.HttpHeaders;

@WebMvcTest(
	    controllers = AuthController.class,
	    excludeAutoConfiguration = {
	        SecurityAutoConfiguration.class,
	        SecurityFilterAutoConfiguration.class
	    }
	)
	@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AuthService authService;
    @MockBean JwtUtil jwtUtil;
    @MockBean DataInitializer dataInitializer;
    @MockBean UserServiceClient userServiceClient;
    @MockBean com.skillsync.authservice.service.OAuthService oAuthService;

    private final AuthResponse authResponse = new AuthResponse("jwt-token", "refresh-token", List.of("ROLE_LEARNER"), "testuser", 1L, "test@example.com");

    // ─── POST /auth/register ─────────────────────────────────────────────────

    @Test
    void register_shouldReturn200_whenValidRequest() throws Exception {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(authService.register(any())).thenReturn(authResponse);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_LEARNER"));
    }

    @Test
    void register_shouldReturn400_whenEmailBlank() throws Exception {
        RegisterRequest request = new RegisterRequest("", "password123");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any());
    }

    @Test
    void register_shouldReturn400_whenPasswordTooShort() throws Exception {
        RegisterRequest request = new RegisterRequest("test@example.com", "abc");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_shouldReturn400_whenInvalidEmail() throws Exception {
        RegisterRequest request = new RegisterRequest("not-an-email", "password123");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_shouldReturn500_whenServiceThrows() throws Exception {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        when(authService.register(any())).thenThrow(new RuntimeException("Email already exists"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    // ─── POST /auth/login ────────────────────────────────────────────────────

    @Test
    void login_shouldReturn200_whenValidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        when(authService.login(any())).thenReturn(authResponse);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void login_shouldReturn400_whenEmailBlank() throws Exception {
        LoginRequest request = new LoginRequest("", "password123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_shouldReturn400_whenPasswordBlank() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ─── POST /auth/refresh ──────────────────────────────────────────────────

    @Test
    void refresh_shouldReturn200_whenValidBearerToken() throws Exception {
        when(jwtUtil.validateRefreshToken("valid-token")).thenReturn(true);
        when(authService.refreshToken("valid-token")).thenReturn(authResponse);

        mockMvc.perform(post("/auth/refresh")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void refresh_shouldReturn401_whenNoBearerPrefix() throws Exception {
        mockMvc.perform(post("/auth/refresh")
                        .header("Authorization", "invalid-token"))
                .andExpect(status().isUnauthorized());

        verify(authService, never()).refreshToken(any());
    }

    @Test
    void refresh_shouldReturn401_whenNoAuthHeader() throws Exception {
        mockMvc.perform(post("/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_shouldUseCookie_whenHeaderMissing() throws Exception {
        when(jwtUtil.validateRefreshToken("cookie-token")).thenReturn(true);
        when(authService.refreshToken("cookie-token")).thenReturn(authResponse);

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new jakarta.servlet.http.Cookie("refreshToken", "cookie-token")))
                .andExpect(status().isOk());
    }

    @Test
    void refresh_shouldReturn401_whenValidTokenCheckFails() throws Exception {
        when(jwtUtil.validateRefreshToken("invalid-token")).thenReturn(false);

        mockMvc.perform(post("/auth/refresh")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_shouldPreferCookieOverHeader() throws Exception {
        when(jwtUtil.validateRefreshToken("cookie-token")).thenReturn(true);
        when(authService.refreshToken("cookie-token")).thenReturn(authResponse);

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new jakarta.servlet.http.Cookie("refreshToken", "cookie-token"))
                        .header("Authorization", "Bearer header-token"))
                .andExpect(status().isOk());
        
        verify(authService).refreshToken("cookie-token");
        verify(authService, never()).refreshToken("header-token");
    }

    @Test
    void logout_shouldReturn200AndClearCookie() throws Exception {
        mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    // ─── OTP / Password Reset ───────────────────────────────────

    @Test
    void sendOtp_shouldReturn200() throws Exception {
        OtpRequest req = new OtpRequest("test@example.com");
        mockMvc.perform(post("/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void verifyOtp_shouldReturn200() throws Exception {
        OtpVerifyRequest req = new OtpVerifyRequest("test@example.com", "123456");
        mockMvc.perform(post("/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void googleLogin_shouldReturn200() throws Exception {
        GoogleTokenRequest req = new GoogleTokenRequest("g-token");
        when(oAuthService.loginWithGoogle("g-token")).thenReturn(authResponse);

        mockMvc.perform(post("/auth/oauth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }

    @Test
    void forgotPassword_shouldReturn200() throws Exception {
        OtpRequest req = new OtpRequest("test@example.com");
        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If this email is registered, an OTP has been sent."));
    }

    @Test
    void verifyForgotPasswordOtp_shouldReturn200() throws Exception {
        OtpVerifyRequest req = new OtpVerifyRequest("test@example.com", "123456");
        mockMvc.perform(post("/auth/verify-forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP verified. You may now reset your password."));
    }

    @Test
    void resetPassword_shouldReturn200() throws Exception {
        ResetPasswordRequest req = new ResetPasswordRequest("test@example.com", "new-password123");
        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully. Please login with your new password."));
    }
}

package com.skillsync.authservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skillsync.authservice.dto.request.LoginRequest;
import com.skillsync.authservice.dto.request.OtpRequest;
import com.skillsync.authservice.dto.request.OtpVerifyRequest;
import com.skillsync.authservice.dto.request.RegisterRequest;
import com.skillsync.authservice.dto.request.ResetPasswordRequest;
import com.skillsync.authservice.dto.response.ApiResponse;
import com.skillsync.authservice.dto.response.AuthResponse;
import com.skillsync.authservice.dto.request.GoogleTokenRequest;
import com.skillsync.authservice.security.JwtUtil;
import com.skillsync.authservice.service.AuthService;
import com.skillsync.authservice.service.OAuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "User authentication and token management")
public class AuthController {

    private final AuthService authService;
    private final OAuthService oAuthService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, OAuthService oAuthService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.oAuthService = oAuthService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/send-otp")
    @Operation(summary = "Send OTP", description = "Send a 6-digit OTP to the given email for verification")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP sent successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already registered")
    })
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody OtpRequest request) {
        authService.sendOtp(request.email());
        return ResponseEntity.ok(new ApiResponse<>("OTP sent to " + request.email(), 200));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP", description = "Verify the OTP sent to the email. Must be done before registration.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP verified successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired OTP")
    })
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        authService.verifyOtp(request.email(), request.otp());
        return ResponseEntity.ok(new ApiResponse<>("Email verified successfully. You may now register.", 200));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Create a new user account. Email must be OTP-verified first.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User registered successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Email not verified or invalid request"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already exists")
    })
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        ResponseCookie cookie = createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticate user with email and password")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful, JWT token provided"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid credentials"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        ResponseCookie cookie = createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT token", description = "Generate a new JWT token using existing refresh token from cookie")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Token expired or invalid")
    })
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Priority: HttpOnly Cookie > Header Fallback
        String tokenToUse = refreshToken;
        
        if (tokenToUse == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            tokenToUse = authHeader.substring(7);
        }

        if (tokenToUse == null) {
            return ResponseEntity.status(401).build();
        }

        // Validate if it's actually a refresh token
        if (!jwtUtil.validateRefreshToken(tokenToUse)) {
            return ResponseEntity.status(401).build();
        }

        AuthResponse response = authService.refreshToken(tokenToUse);
        ResponseCookie cookie = createRefreshTokenCookie(response.refreshToken());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Clear the refresh token cookie")
    public ResponseEntity<ApiResponse<Void>> logout() {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new ApiResponse<>("Logged out successfully", 200));
    }

    // ─────────────────────────────────────────────────────────────
    // Helper
    // ─────────────────────────────────────────────────────────────

    private ResponseCookie createRefreshTokenCookie(String token) {
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days matches JwtUtil
                .sameSite("Lax")
                .build();
    }


    // ─────────────────────────────────────────────────────────────
    // Forgot Password
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Send OTP to registered email for password reset")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP sent if email is registered")
    })
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody OtpRequest request) {
        authService.sendForgotPasswordOtp(request.email());
        // Always return 200 - don't reveal if email exists (security best practice)
        return ResponseEntity.ok(new ApiResponse<>("If this email is registered, an OTP has been sent.", 200));
    }

    @PostMapping("/verify-forgot-password")
    @Operation(summary = "Verify forgot password OTP", description = "Verify OTP before allowing password reset")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP verified, proceed to reset password"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired OTP")
    })
    public ResponseEntity<ApiResponse<Void>> verifyForgotPasswordOtp(@Valid @RequestBody OtpVerifyRequest request) {
        authService.verifyForgotPasswordOtp(request.email(), request.otp());
        return ResponseEntity.ok(new ApiResponse<>("OTP verified. You may now reset your password.", 200));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Set a new password after OTP verification")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "OTP not verified or invalid request")
    })
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.email(), request.newPassword());
        return ResponseEntity.ok(new ApiResponse<>("Password reset successfully. Please login with your new password.", 200));
    }

    // ─────────────────────────────────────────────────────────────
    // OAuth
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/oauth/google")
    @Operation(summary = "Google OAuth login", description = "Login or register using a Google id_token")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid Google token")
    })
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleTokenRequest request) {
        AuthResponse response = oAuthService.loginWithGoogle(request.idToken());
        ResponseCookie cookie = createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }
}

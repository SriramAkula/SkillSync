package com.skillsync.authservice.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.dto.request.LoginRequest;
import com.skillsync.authservice.dto.request.RegisterRequest;
import com.skillsync.authservice.dto.response.AuthResponse;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.event.UserCreatedEvent;
import com.skillsync.authservice.exception.AuthException;
import com.skillsync.authservice.exception.InvalidCredentialsException;
import com.skillsync.authservice.exception.InvalidOtpException;
import com.skillsync.authservice.exception.UserAlreadyExistsException;
import com.skillsync.authservice.exception.UserNotFoundException;
import com.skillsync.authservice.exception.AccountDeactivatedException;
import com.skillsync.authservice.exception.ProviderMismatchException;
import com.skillsync.authservice.publisher.AuthEventPublisher;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.JwtUtil;

import com.skillsync.authservice.audit.AuditService;

import com.skillsync.authservice.enums.AuthProvider;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserServiceClient userServiceClient;
    private final AuthEventPublisher eventPublisher;
    private final OtpService otpService;
    private final AuditService auditService;

    @Override
    public void sendOtp(String email) {
        User existingUser = userRepository.findByEmail(email).orElse(null);
        if (existingUser != null) {
            // Block if user already has a local password (LOCAL or BOTH)
            if (existingUser.getAuthProvider() == AuthProvider.LOCAL || existingUser.getAuthProvider() == AuthProvider.BOTH) {
                throw new UserAlreadyExistsException("Email already registered and has a password set. Please login or use 'Forgot Password'.");
            }
            // If it's just GOOGLE or GITHUB, allow them to proceed to verify and "upgrade"
            log.info("Allowing OTP for existing {} user to enable account upgrade: email={}", 
                    existingUser.getAuthProvider(), email);
        }
        
        otpService.sendOtp(email);
        log.info("OTP send requested for email={}", email);
    }

    @Override
    public void verifyOtp(String email, String otp) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new InvalidOtpException("Invalid or expired OTP");
        }
        log.info("OTP verified for email={}", email);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!otpService.isEmailVerified(request.email())) {
            throw new InvalidOtpException("Email not verified. Please verify your email with OTP before registering.");
        }

        User existingUser = userRepository.findByEmail(request.email().toLowerCase()).orElse(null);
        if (existingUser != null) {
            // If user exists and is purely OAuth, we can "upgrade" them to BOTH
            if (existingUser.getAuthProvider() == AuthProvider.GOOGLE || existingUser.getAuthProvider() == AuthProvider.GITHUB) {
                log.info("Upgrading OAuth user to BOTH status during registration: email={}", request.email());
                existingUser.setPassword(passwordEncoder.encode(request.password()));
                existingUser.setAuthProvider(AuthProvider.BOTH);
                userRepository.save(existingUser);
                
                // Clear verified flag
                otpService.clearVerification(request.email());
                
                List<String> roles = Arrays.asList(existingUser.getRole().split(","));
                String token = jwtUtil.generateToken(existingUser.getId(), existingUser.getEmail(), roles);
                String refreshToken = jwtUtil.generateRefreshToken(existingUser.getId(), existingUser.getEmail(), roles);
                return new AuthResponse(token, refreshToken, roles, existingUser.getUsername(), existingUser.getId(), existingUser.getEmail());
            } else {
                throw new UserAlreadyExistsException("Email already exists");
            }
        }

        String generatedUsername = request.email().split("@")[0].toLowerCase();
        if (userRepository.existsByUsername(generatedUsername)) {
            // Fallback to dot replacement if common username exists, or handle collision
            generatedUsername = request.email().replace("@", ".").toLowerCase();
            if (userRepository.existsByUsername(generatedUsername)) {
                throw new UserAlreadyExistsException("Username derived from email already exists");
            }
        }

        User user = new User(
            request.email().toLowerCase(),
            passwordEncoder.encode(request.password()),
            generatedUsername,
            "ROLE_LEARNER"
        );
        user = userRepository.save(user);

        // Clear verified flag after successful registration
        otpService.clearVerification(request.email());
        auditService.log("User", user.getId(), "REGISTER", user.getId().toString(), "email=" + user.getEmail());

        try {
            UserCreatedEvent event = new UserCreatedEvent(
                user.getId(), user.getEmail(), null,
                user.getUsername(), user.getRole(), System.currentTimeMillis()
            );
            eventPublisher.publishUserCreated(event);
            log.info("UserCreatedEvent published for userId={}", user.getId());
        } catch (Exception e) {
            log.warn("Failed to publish UserCreatedEvent: {}", e.getMessage());
        }

        try {
            Map<String, Object> userData = new HashMap<>();
            userData.put("userId", user.getId());
            userData.put("email", user.getEmail());
            userData.put("username", user.getUsername());
            userData.put("role", user.getRole());
            userServiceClient.createProfile(userData);
            log.info("UserProfile created via Feign for userId={}", user.getId());
        } catch (Exception e) {
            log.info("Feign sync failed, relying on event-based sync: {}", e.getMessage());
        }

        List<String> roles = Arrays.asList(user.getRole().split(","));
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), roles);
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail(), roles);
        return new AuthResponse(token, refreshToken, roles, user.getUsername(), user.getId(), user.getEmail());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AccountDeactivatedException("Your account has been deactivated. Please contact support.");
        }

        // Allow login if provider is LOCAL or BOTH
        if (user.getAuthProvider() == AuthProvider.GOOGLE || user.getAuthProvider() == AuthProvider.GITHUB) {
            throw new ProviderMismatchException(
                "This account currently uses " + user.getAuthProvider() + " login. " +
                "Please use the social login button or reset your password to enable email login."
            );
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid password");
        }

        List<String> roles = Arrays.asList(user.getRole().split(","));
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), roles);
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail(), roles);
        auditService.log("User", user.getId(), "LOGIN", user.getId().toString(), "email=" + user.getEmail());
        return new AuthResponse(token, refreshToken, roles, user.getUsername(), user.getId(), user.getEmail());
    }

    @Override
    public AuthResponse refreshToken(String token) {
        // extractEmailIgnoreExpiry allows refresh even when access token is expired
        String email = jwtUtil.extractEmailIgnoreExpiry(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AccountDeactivatedException("Session invalid: Account is deactivated.");
        }

        List<String> roles = Arrays.asList(user.getRole().split(","));
        String newAccessToken = jwtUtil.generateToken(user.getId(), email, roles);
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId(), email, roles);
        return new AuthResponse(newAccessToken, newRefreshToken, roles, user.getUsername(), user.getId(), user.getEmail());
    }

    // ─────────────────────────────────────────────────────────────
    // Forgot Password
    // ─────────────────────────────────────────────────────────────

    @Override
    public void sendForgotPasswordOtp(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Silent return - don't reveal if email exists
            log.warn("Forgot password requested for non-existent email={}", email);
            return;
        }
        if (Boolean.FALSE.equals(user.getIsActive())) {
            log.warn("Forgot password requested for deactivated account email={}", email);
            return;
        }
        // OAuth users CAN reset password - this enables flexible account linking
        // After reset, they can login with either Google OR password
        otpService.sendPasswordResetOtp(email);
        log.info("Forgot password OTP sent for email={}, provider={}", email, user.getAuthProvider());
    }

    @Override
    public void verifyForgotPasswordOtp(String email, String otp) {
        if (!otpService.verifyPasswordResetOtp(email, otp)) {
            throw new InvalidOtpException("Invalid or expired OTP");
        }
        log.info("Forgot password OTP verified for email={}", email);
    }

    @Override
    @Transactional
    public void resetPassword(String email, String newPassword) {
        if (!otpService.isPasswordResetVerified(email)) {
            throw new InvalidOtpException("OTP not verified. Please verify your OTP before resetting password.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AccountDeactivatedException("Account is deactivated. Please contact support.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        // If OAuth user sets a real password, enable BOTH login (flexible account linking)
        if (user.getAuthProvider() == AuthProvider.GOOGLE || user.getAuthProvider() == AuthProvider.GITHUB) {
            user.setAuthProvider(AuthProvider.BOTH);
            log.info("OAuth user linked to BOTH login via password reset: email={}", email);
        }
        userRepository.save(user);

        // Clear the reset-verified flag after successful reset
        otpService.clearPasswordResetVerification(email);

        auditService.log("User", user.getId(), "PASSWORD_RESET", user.getId().toString(),
                "email=" + email);
        log.info("Password reset successfully for email={}", email);
    }
}
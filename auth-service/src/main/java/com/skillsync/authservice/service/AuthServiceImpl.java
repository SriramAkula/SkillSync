package com.skillsync.authservice.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.dto.request.LoginRequest;
import com.skillsync.authservice.dto.request.RegisterRequest;
import com.skillsync.authservice.dto.response.AuthResponse;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.event.UserCreatedEvent;
import com.skillsync.authservice.publisher.AuthEventPublisher;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.JwtUtil;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserServiceClient userServiceClient;
    private final AuthEventPublisher eventPublisher;
    private final OtpService otpService;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil,
                           UserServiceClient userServiceClient,
                           AuthEventPublisher eventPublisher,
                           OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.userServiceClient = userServiceClient;
        this.eventPublisher = eventPublisher;
        this.otpService = otpService;
    }

    @Override
    public void sendOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }
        otpService.sendOtp(email);
        log.info("OTP send requested for email={}", email);
    }

    @Override
    public void verifyOtp(String email, String otp) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        log.info("OTP verified for email={}", email);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!otpService.isEmailVerified(request.email())) {
            throw new RuntimeException("Email not verified. Please verify your email with OTP before registering.");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already exists");
        }

        String generatedUsername = request.email().replace("@", ".").toLowerCase();
        if (userRepository.existsByUsername(generatedUsername)) {
            throw new RuntimeException("Username derived from email already exists");
        }

        User user = new User(
            request.email(),
            passwordEncoder.encode(request.password()),
            generatedUsername,
            "ROLE_LEARNER"
        );
        user = userRepository.save(user);

        // Clear verified flag after successful registration
        otpService.clearVerification(request.email());

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
            userServiceClient.createProfile(userData);
            log.info("UserProfile created via Feign for userId={}", user.getId());
        } catch (Exception e) {
            log.info("Feign sync failed, relying on event-based sync: {}", e.getMessage());
        }

        List<String> roles = Arrays.asList(user.getRole().split(","));
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), roles);
        return new AuthResponse(token, roles);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new RuntimeException("Your account has been deactivated. Please contact support.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        List<String> roles = Arrays.asList(user.getRole().split(","));
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), roles);
        return new AuthResponse(token, roles);
    }

    @Override
    public AuthResponse refreshToken(String token) {
        String email = jwtUtil.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new RuntimeException("Session invalid: Account is deactivated.");
        }

        List<String> roles = Arrays.asList(user.getRole().split(","));
        String newToken = jwtUtil.generateToken(user.getId(), email, roles);
        return new AuthResponse(newToken, roles);
    }
}
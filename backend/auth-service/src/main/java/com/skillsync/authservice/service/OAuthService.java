package com.skillsync.authservice.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.skillsync.authservice.audit.AuditService;
import com.skillsync.authservice.dto.response.AuthResponse;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.enums.AuthProvider;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.event.UserCreatedEvent;
import com.skillsync.authservice.publisher.AuthEventPublisher;
import java.util.HashMap;
import java.util.Map;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class OAuthService {

    private static final Logger log = LoggerFactory.getLogger(OAuthService.class);

    @Value("${google.oauth2.client-id}")
    private String googleClientId;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;
    private final UserServiceClient userServiceClient;
    private final AuthEventPublisher eventPublisher;

    public OAuthService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        JwtUtil jwtUtil,
                        AuditService auditService,
                        UserServiceClient userServiceClient,
                        AuthEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.auditService = auditService;
        this.userServiceClient = userServiceClient;
        this.eventPublisher = eventPublisher;
    }
    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        GoogleIdToken.Payload payload = verifyGoogleToken(idToken);

        String email      = payload.getEmail();
        String providerId = payload.getSubject(); // Google's unique user ID
        String name       = (String) payload.get("name");

        User user = userRepository.findByEmail(email)
                .map(existing -> handleExistingUser(existing, providerId))
                .orElseGet(() -> createOAuthUser(email, name, providerId, AuthProvider.GOOGLE));

        List<String> roles = Arrays.asList(user.getRole().split(","));
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), roles);
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail(), roles);

        auditService.log("User", user.getId(), "OAUTH_LOGIN_GOOGLE",
                user.getId().toString(), "email=" + email);
        log.info("Google OAuth login successful for email={}", email);

        return new AuthResponse(token, refreshToken, roles, user.getUsername(), user.getId(), user.getEmail());
    }

    // ─────────────────────────────────────────────────────────────
    // Handle existing user - block if LOCAL, allow if GOOGLE
    // ─────────────────────────────────────────────────────────────
    private User handleExistingUser(User user, String providerId) {
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new RuntimeException("Your account has been deactivated. Please contact support.");
        }

        if (user.getAuthProvider() == AuthProvider.LOCAL) {
            throw new RuntimeException(
                "This email is already registered with password login. " +
                "Please login with your email and password."
            );
        }
        // Update providerId if missing (first OAuth login after migration)
        if (user.getProviderId() == null) {
            user.setProviderId(providerId);
            userRepository.save(user);
        }
        return user;
    }

    // ─────────────────────────────────────────────────────────────
    // Create new OAuth user with dummy password - password stays NOT NULL
    // ─────────────────────────────────────────────────────────────
    private User createOAuthUser(String email, String name, String providerId, AuthProvider provider) {
        String username = email.split("@")[0].toLowerCase();

        // Handle duplicate username
        if (userRepository.existsByUsername(username)) {
            username = username + "." + UUID.randomUUID().toString().substring(0, 4);
        }

        // Dummy password - random UUID, unguessable, user will never know it
        String dummyPassword = passwordEncoder.encode(UUID.randomUUID().toString());

        User user = new User(email, dummyPassword, username, "ROLE_LEARNER");
        user.setAuthProvider(provider);
        user.setProviderId(providerId);

        User saved = userRepository.save(user);
        log.info("New OAuth user created: email={}, provider={}", email, provider);
        auditService.log("User", saved.getId(), "OAUTH_REGISTER",
                saved.getId().toString(), "email=" + email + ",provider=" + provider);

        try {
            UserCreatedEvent event = new UserCreatedEvent(
                saved.getId(), saved.getEmail(), null,
                saved.getUsername(), saved.getRole(), System.currentTimeMillis()
            );
            eventPublisher.publishUserCreated(event);
            log.info("UserCreatedEvent published for OAuth userId={}", saved.getId());
        } catch (Exception e) {
            log.warn("Failed to publish UserCreatedEvent for OAuth: {}", e.getMessage());
        }

        try {
            Map<String, Object> userData = new HashMap<>();
            userData.put("userId", saved.getId());
            userData.put("email", saved.getEmail());
            userData.put("username", saved.getUsername());
            userServiceClient.createProfile(userData);
            log.info("UserProfile created via Feign for OAuth userId={}", saved.getId());
        } catch (Exception e) {
            log.info("Feign sync failed for OAuth, relying on event-based sync: {}", e.getMessage());
        }

        return saved;
    }

    // ─────────────────────────────────────────────────────────────
    // Verify Google id_token
    // ─────────────────────────────────────────────────────────────
    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new RuntimeException("Invalid Google token");
            }
            return googleIdToken.getPayload();

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed: {}", e.getMessage());
            throw new RuntimeException("Google token verification failed: " + e.getMessage());
        }
    }
}

package com.skillsync.authservice.config;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.UserRepository;

@Component
@Slf4j
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserServiceClient userServiceClient;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${superadmin.email}")
    private String superAdminEmail;

    @Value("${superadmin.password}")
    private String superAdminPassword;

    @Value("${superadmin.username}")
    private String superAdminUsername;

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    @Override
    public void run(String... args) throws Exception {
        createAdminIfNotExists(adminEmail, adminPassword, adminUsername, "Administrator");
        createAdminIfNotExists(superAdminEmail, superAdminPassword, superAdminUsername, "Super Administrator");
        log.info("\n===== DATA INITIALIZATION COMPLETE =====");
        log.info("Admin accounts created and synced to User Service.");
        log.info("========================================\n");
    }

    private void createAdminIfNotExists(String email, String password, String username, String displayName) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        User admin = new User(email, passwordEncoder.encode(password), username, ROLE_ADMIN);
        User saved = userRepository.save(admin);

        try {
            Map<String, Object> userData = new HashMap<>();
            userData.put("email", saved.getEmail());
            userData.put("name", displayName);
            userData.put("username", saved.getUsername());
            userServiceClient.createProfile(userData);
            log.info("Admin synced to User Service: {}", saved.getEmail());
        } catch (Exception e) {
            log.error("Failed to sync admin to User Service: {}", e.getMessage());
        }

        log.info("-------------------------------------------");
        log.info("SUCCESS: Admin Created! Email: " + email + " | Username: " + username);
        log.info("-------------------------------------------");
    }
}

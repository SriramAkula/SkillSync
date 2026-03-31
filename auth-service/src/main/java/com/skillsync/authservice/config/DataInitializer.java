package com.skillsync.authservice.config;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    @Value("${admin.email:admin@skillsync.com}")
    private String adminEmail;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${superadmin.email:superadmin@skillsync.com}")
    private String superAdminEmail;

    @Value("${superadmin.password:superadmin123}")
    private String superAdminPassword;

    @Value("${superadmin.username:superadmin}")
    private String superAdminUsername;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserServiceClient userServiceClient;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           UserServiceClient userServiceClient) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userServiceClient = userServiceClient;
    }

    @Override
    public void run(String... args) throws Exception {
        createAdminIfNotExists(adminEmail, adminPassword, adminUsername, "Administrator");
        createAdminIfNotExists(superAdminEmail, superAdminPassword, superAdminUsername, "Super Administrator");
        System.out.println("\n===== DATA INITIALIZATION COMPLETE =====");
        System.out.println("Admin accounts created and synced to User Service.");
        System.out.println("========================================\n");
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

        System.out.println("-------------------------------------------");
        System.out.println("SUCCESS: Admin Created! Email: " + email + " | Username: " + username);
        System.out.println("-------------------------------------------");
    }
}

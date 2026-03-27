package com.skillsync.authservice.config;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserServiceClient userServiceClient;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, UserServiceClient userServiceClient) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userServiceClient = userServiceClient;
    }

    @Override
    public void run(String... args) throws Exception {
        // Create first admin
        if (!userRepository.existsByEmail("admin@skillsync.com")) {
            User admin1 = new User(
                "admin@skillsync.com",              // email
                passwordEncoder.encode("admin123"), // password
                "admin",                            // username
                "ROLE_ADMIN"                        // role
            );

            User savedAdmin1 = userRepository.save(admin1);
            
            // Sync with User Service
            try {
                Map<String, Object> admin1Data = new HashMap<>();
                admin1Data.put("email", savedAdmin1.getEmail());
                admin1Data.put("name", "Administrator"); // Passed hardcoded to avoid relying on auth entity
                admin1Data.put("username", savedAdmin1.getUsername());
                
                userServiceClient.createProfile(admin1Data);
                log.info("Admin 1 synced to User Service: {}", savedAdmin1.getEmail());
            } catch (Exception e) {
                log.error("Failed to sync Admin 1 to User Service: {}", e.getMessage());
            }
            
            System.out.println("-------------------------------------------");
            System.out.println("SUCCESS: Admin User 1 Created!");
            System.out.println("Email: admin@skillsync.com");
            System.out.println("Username: admin");
            System.out.println("Role: ROLE_ADMIN");
            System.out.println("-------------------------------------------");
        }

        // Create second admin
        if (!userRepository.existsByEmail("superadmin@skillsync.com")) {
            User admin2 = new User(
                "superadmin@skillsync.com",              // email
                passwordEncoder.encode("superadmin123"), // password
                "superadmin",                            // username
                "ROLE_ADMIN"                             // role
            );

            User savedAdmin2 = userRepository.save(admin2);
            
            // Sync with User Service
            try {
                Map<String, Object> admin2Data = new HashMap<>();
                admin2Data.put("email", savedAdmin2.getEmail());
                admin2Data.put("name", "Super Administrator");
                admin2Data.put("username", savedAdmin2.getUsername());
                
                userServiceClient.createProfile(admin2Data);
                log.info("Admin 2 synced to User Service: {}", savedAdmin2.getEmail());
            } catch (Exception e) {
                log.error("Failed to sync Admin 2 to User Service: {}", e.getMessage());
            }
            
            System.out.println("-------------------------------------------");
            System.out.println("SUCCESS: Admin User 2 Created!");
            System.out.println("Email: superadmin@skillsync.com");
            System.out.println("Username: superadmin");
            System.out.println("Role: ROLE_ADMIN");
            System.out.println("-------------------------------------------");
        }

        System.out.println("\n===== DATA INITIALIZATION COMPLETE =====");
        System.out.println("Admin accounts created and synced to User Service.");
        System.out.println("========================================\n");
    }
}
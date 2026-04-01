package com.skillsync.authservice.controller.internal;

import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.dto.AuthProfileUpdateDTO;
import com.skillsync.authservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * Internal controller for User Service to update auth user information
 */
@RestController
@RequestMapping("/internal/users")
public class InternalUserController {

    private static final Logger logger = LoggerFactory.getLogger(InternalUserController.class);

    @Autowired
    private UserRepository userRepository;

    /**
     * Update user profile information in Auth Service
     * Called by User Service when profile is updated
     * Only allows updating: username, name
     * Email is NOT updated from here
     * 
     * 
     */
    @PutMapping("/{userId}/profile")
    public ResponseEntity<Void> updateUserProfile(
            @PathVariable Long userId,
            @RequestBody AuthProfileUpdateDTO updates,
            @RequestHeader(value = "X-Internal-Service", required = false) String internalService,
            @RequestHeader(value = "X-Service-Auth", required = false) String serviceAuth) {
        
        logger.info("Received profile update from: {}", internalService != null ? internalService : "unknown service");
        logger.info("   userId={}, updates={}", userId, updates);
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            logger.warn("User not found in Auth Service: userId={}", userId);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        logger.info("   Current values: username={}", user.getUsername());

        // Only allow updating username, NOT email
        if (updates.getUsername() != null && !updates.getUsername().isEmpty()) {
            user.setUsername(updates.getUsername());
            logger.info("    Username updated to: {}", updates.getUsername());
        }

        userRepository.save(user);
        logger.info("Profile successfully updated in Auth Service: userId={}", userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Update user roles in Auth Service
     * Called by Mentor Service when mentor is approved
     * 
     * @param userId User ID
     * @param role Role to be added
     */
    @PutMapping("/{userId}/roles")
    public ResponseEntity<Void> addUserRole(
            @PathVariable Long userId,
            @RequestParam String role,
            @RequestHeader(value = "X-Internal-Service", required = false) String internalService) {
        
        logger.info("Received role update from: {}", internalService != null ? internalService : "unknown service");
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            logger.warn("User not found in Auth Service: userId={}", userId);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (!user.getRole().contains(role)) {
            user.setRole(user.getRole() + "," + role);
            userRepository.save(user);
            logger.info("   Role {} added to user {}", role, userId);
        } else {
            logger.info("   User {} already has role {}", userId, role);
        }
        return ResponseEntity.ok().build();
    }
}

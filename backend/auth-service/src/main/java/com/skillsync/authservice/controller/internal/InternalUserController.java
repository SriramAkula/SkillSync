package com.skillsync.authservice.controller.internal;

import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.dto.AuthProfileUpdateDTO;
import com.skillsync.authservice.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;

/**
 * Internal controller for User Service to update auth user information
 */
@RestController
@RequestMapping("/internal/users")
@Slf4j
@RequiredArgsConstructor
public class InternalUserController {

    private final UserRepository userRepository;

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
        
        log.info("Received profile update from: {}", internalService != null ? internalService : "unknown service");
        log.info("   userId={}, updates={}", userId, updates);
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User not found in Auth Service: userId={}", userId);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        log.info("   Current values: username={}", user.getUsername());

        // Only allow updating username, NOT email
        if (updates.getUsername() != null && !updates.getUsername().isEmpty()) {
            user.setUsername(updates.getUsername());
            log.info("    Username updated to: {}", updates.getUsername());
            userRepository.save(user);
            log.info("Profile successfully updated in Auth Service: userId={}", userId);
        } else {
            log.info("No profile fields updated in Auth Service: userId={}", userId);
        }


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
        
        log.info("Received role update from: {}", internalService != null ? internalService : "unknown service");
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User not found in Auth Service: userId={}", userId);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (!user.getRole().contains(role)) {
            user.setRole(user.getRole() + "," + role);
            userRepository.save(user);
            log.info("   Role {} added to user {}", role, userId);
        } else {
            log.info("   User {} already has role {}", userId, role);
        }
        return ResponseEntity.ok().build();
    }

    /**
     * Get user roles from Auth Service
     * Called by User Service to retrieve roles for admin panel
     * 
     * @param userId User ID
     * @return Set of role names (e.g., ROLE_USER, ROLE_MENTOR, ROLE_ADMIN)
     */
    @GetMapping("/{userId}/roles")
    public ResponseEntity<Set<String>> getUserRoles(
            @PathVariable Long userId,
            @RequestHeader(value = "X-Internal-Service", required = false) String internalService,
            @RequestHeader(value = "X-Service-Auth", required = false) String serviceAuth) {
        
        log.info("Fetching roles for userId: {} (requested by: {})", userId, internalService != null ? internalService : "unknown service");
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User not found in Auth Service: userId={}", userId);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        // Parse comma-separated roles string into a Set
        Set<String> roles = new HashSet<>();
        if (user.getRole() != null && !user.getRole().isEmpty()) {
            String[] roleArray = user.getRole().split(",");
            roles.addAll(Arrays.asList(roleArray));
        }
        
        log.info("   Retrieved roles for user {}: {}", userId, roles);
        return ResponseEntity.ok(roles);
    }

    /**
     * Update user active status in Auth Service
     * Called by User Service when a user is blocked/unblocked
     * 
     * @param userId User ID
     * @param isActive New active status
     */
    @PutMapping("/{userId}/status")
    public ResponseEntity<Void> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam boolean isActive,
            @RequestHeader(value = "X-Internal-Service", required = false) String internalService,
            @RequestHeader(value = "X-Service-Auth", required = false) String serviceAuth) {
        
        log.info("Received status update from: {} for userId: {}, isActive: {}", 
                internalService != null ? internalService : "unknown service", userId, isActive);
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User not found in Auth Service: userId={}", userId);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        user.setIsActive(isActive);
        userRepository.save(user);
        
        log.info("User {} status updated to isActive={} in Auth Service", userId, isActive);
        return ResponseEntity.ok().build();
    }
}

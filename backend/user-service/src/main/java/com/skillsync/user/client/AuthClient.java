package com.skillsync.user.client;

import com.skillsync.user.dto.internal.AuthProfileUpdateDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Set;

/**
 * Feign client for Auth Service
 * Automatically includes headers via FeignConfig RequestInterceptor
 */
@FeignClient(name = "auth-service", url = "${AUTH_SERVICE_URL:http://auth-service:8081}")
public interface AuthClient {

    @PutMapping("/internal/users/{userId}/profile")
    ResponseEntity<Void> updateUserProfile(
            @PathVariable("userId") Long userId,
            @RequestBody AuthProfileUpdateDTO updates
    );

    @GetMapping("/internal/users/{userId}/roles")
    Set<String> getUserRoles(
            @PathVariable("userId") Long userId
    );

    @PutMapping("/internal/users/{userId}/status")
    void updateUserStatus(
            @PathVariable("userId") Long userId,
            @RequestParam("isActive") boolean isActive
    );
}

package com.skillsync.user.client;

import com.skillsync.user.dto.internal.AuthProfileUpdateDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

/**
 * Feign client for Auth Service
 */
@FeignClient(name = "auth-service")
public interface AuthClient {

    @PutMapping("/internal/users/{userId}/profile")
    ResponseEntity<Void> updateUserProfile(
            @PathVariable("userId") Long userId,
            @RequestBody AuthProfileUpdateDTO updates,
            @RequestHeader("X-Internal-Service") String internalService
    );
}

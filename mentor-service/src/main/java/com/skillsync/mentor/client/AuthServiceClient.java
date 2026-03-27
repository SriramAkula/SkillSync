package com.skillsync.mentor.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "auth-service", path = "/internal/users")
public interface AuthServiceClient {

    @PutMapping("/{userId}/roles")
    ResponseEntity<Void> addUserRole(
            @PathVariable("userId") Long userId,
            @RequestParam("role") String role
    );
}

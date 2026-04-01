package com.skillsync.notification.client;

import com.skillsync.notification.dto.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", fallback = UserServiceClientFallback.class)
public interface UserServiceClient {
    
    @GetMapping("/user/internal/users/{userId}")
    UserProfileResponse getUserById(@PathVariable("userId") Long userId);
}

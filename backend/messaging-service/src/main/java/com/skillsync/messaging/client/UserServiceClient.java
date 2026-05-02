package com.skillsync.messaging.client;

import com.skillsync.messaging.dto.ApiResponse;
import com.skillsync.messaging.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", fallback = UserServiceClientFallback.class)
public interface UserServiceClient {

    @GetMapping("/user/internal/users/{id}")
    ApiResponse<UserDTO> getUserById(@PathVariable("id") Long id);
}

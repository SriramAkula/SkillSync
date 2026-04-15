package com.skillsync.group.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.skillsync.group.dto.ApiResponse;
import lombok.Builder;
import lombok.Data;

@FeignClient(name = "user-service", path = "/user")
public interface UserServiceClient {

    @GetMapping("/profile/{userId}")
    ApiResponse<UserProfileDto> getProfile(@PathVariable("userId") Long userId);

    @Data
    @Builder
    class UserProfileDto {
        private Long userId;
        private String email;
        private String username;
        private String role;
    }
}

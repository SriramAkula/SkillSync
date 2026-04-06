package com.skillsync.session.client;

import com.skillsync.session.dto.response.UserProfileResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for User Service
 * Used to fetch user profile details and check blocked status
 */
@FeignClient(name = "user-service", url = "${USER_SERVICE_URL:http://user-service:8082}")
public interface UserClient {

    @GetMapping("/user/internal/users/{userId}")
    com.skillsync.session.dto.ApiResponse<UserProfileResponseDto> getUserProfile(
            @PathVariable("userId") Long userId
    );
}

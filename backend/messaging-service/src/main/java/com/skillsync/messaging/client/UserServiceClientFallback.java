package com.skillsync.messaging.client;

import com.skillsync.messaging.dto.ApiResponse;
import com.skillsync.messaging.dto.UserDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class UserServiceClientFallback implements UserServiceClient {

    @Override
    public ApiResponse<UserDTO> getUserById(Long id) {
        log.warn("User-service is unavailable. Fallback is triggered for user ID: {}", id);
        return ApiResponse.error("User service is unavailable",
                org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
    }
}

package com.skillsync.messaging.client;

import com.skillsync.messaging.dto.ApiResponse;
import com.skillsync.messaging.dto.UserDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserServiceClientFallbackTest {

    private final UserServiceClientFallback fallback = new UserServiceClientFallback();

    @Test
    @DisplayName("getUserById - returns error response")
    void getUserById_ReturnsError() {
        ApiResponse<UserDTO> result = fallback.getUserById(1L);
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getMessage()).isEqualTo("User service is unavailable");
    }
}

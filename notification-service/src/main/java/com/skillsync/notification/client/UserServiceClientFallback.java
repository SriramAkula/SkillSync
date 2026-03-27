package com.skillsync.notification.client;

import com.skillsync.notification.dto.UserDTO;
import com.skillsync.notification.dto.UserProfileResponse;
import org.springframework.stereotype.Component;

@Component
public class UserServiceClientFallback implements UserServiceClient {
    
    @Override
    public UserProfileResponse getUserById(Long userId) {
        // Fallback: Return response with placeholder email
        UserDTO fallback = new UserDTO();
        fallback.setId(userId);
        fallback.setEmail("user" + userId + "@example.com");
        return new UserProfileResponse("User fetched from fallback", fallback);
    }
}


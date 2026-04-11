package com.skillsync.session.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * User Profile Response DTO for Session Service
 * Minimal fields required for authorization and block checks
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto {

    private Long userId;
    private String username;
    private String email;
    private Boolean isBlocked;

    public Boolean getIsBlocked() {
        return isBlocked;
    }
}


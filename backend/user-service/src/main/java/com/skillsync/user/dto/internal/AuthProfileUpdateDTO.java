package com.skillsync.user.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sending profile updates to Auth Service
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthProfileUpdateDTO {
    private String username;
}

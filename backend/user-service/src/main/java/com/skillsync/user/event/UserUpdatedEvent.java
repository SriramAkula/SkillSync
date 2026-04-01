package com.skillsync.user.event;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event published by Auth Service when a user is updated
 * Consumed by User Service to sync UserProfile
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdatedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private Long userId;
    private String email;
    private String name;
    private String username;
    private String role;
    private Boolean isActive;
    private Long updatedAtMillis;
}

package com.skillsync.authservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Event published when a user is updated in Auth Service
 * Consumed by User Service to update corresponding UserProfile
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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


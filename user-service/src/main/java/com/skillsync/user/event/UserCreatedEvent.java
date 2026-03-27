package com.skillsync.user.event;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event published by Auth Service when a new user is created
 * Consumed by User Service to create corresponding UserProfile
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCreatedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private Long userId;
    private String email;
    private String name;
    private String username;
    private String role;
    private Long createdAtMillis;
}

package com.skillsync.authservice.event;

import java.io.Serializable;

/**
 * Event published when a new user is created in Auth Service
 * Consumed by User Service to create corresponding UserProfile
 */
public class UserCreatedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private Long userId;
    private String email;
    private String name;
    private String username;
    private String role;
    private Long createdAtMillis;
    
    public UserCreatedEvent() {}
    
    public UserCreatedEvent(Long userId, String email, String name, String username, String role, Long createdAtMillis) {
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.username = username;
        this.role = role;
        this.createdAtMillis = createdAtMillis;
    }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public Long getCreatedAtMillis() { return createdAtMillis; }
    public void setCreatedAtMillis(Long createdAtMillis) { this.createdAtMillis = createdAtMillis; }
}

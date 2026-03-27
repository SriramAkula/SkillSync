package com.skillsync.authservice.event;

import java.io.Serializable;

/**
 * Event published when a user is updated in Auth Service
 * Consumed by User Service to update corresponding UserProfile
 */
public class UserUpdatedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private Long userId;
    private String email;
    private String name;
    private String username;
    private String role;
    private Boolean isActive;
    private Long updatedAtMillis;
    
    public UserUpdatedEvent() {}
    
    public UserUpdatedEvent(Long userId, String email, String name, String username, String role, Boolean isActive, Long updatedAtMillis) {
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.username = username;
        this.role = role;
        this.isActive = isActive;
        this.updatedAtMillis = updatedAtMillis;
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
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public Long getUpdatedAtMillis() { return updatedAtMillis; }
    public void setUpdatedAtMillis(Long updatedAtMillis) { this.updatedAtMillis = updatedAtMillis; }
}


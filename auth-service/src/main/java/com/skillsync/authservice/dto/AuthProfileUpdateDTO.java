package com.skillsync.authservice.dto;

/**
 * DTO for receiving profile updates from User Service
 * Only contains fields that should be synchronized from user database
 */
public class AuthProfileUpdateDTO {
    private String username;

    public AuthProfileUpdateDTO() {
    }

    public AuthProfileUpdateDTO(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    @Override
    public String toString() {
        return "AuthProfileUpdateDTO{" +
                "username='" + username + '\'' +
                '}';
    }
}

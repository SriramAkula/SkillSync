package com.skillsync.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long id;
    private Long userId;
    private String name;
    private String username;
    private String email;
    private String role;
    private String bio;
    private String phoneNumber;
    private String profileImageUrl;
    private String skills;
    private Double rating;
    private Integer totalReviews;
    private Boolean isProfileComplete;
    private Boolean isBlocked;
}

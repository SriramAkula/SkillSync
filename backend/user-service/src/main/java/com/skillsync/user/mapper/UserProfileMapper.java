package com.skillsync.user.mapper;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.entity.UserProfile;
import org.springframework.stereotype.Component;

@Component
public class UserProfileMapper {

    // userId + email + username -> new UserProfile entity (on registration)
    public UserProfile toEntity(Long userId, String email, String username) {
        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        profile.setEmail(email);
        
        // Ensure username is never blank on creation
        boolean hasUsername = username != null && !username.trim().isEmpty();
        profile.setUsername(hasUsername ? username : email.split("@")[0]);
        
        profile.setProfileComplete(false);
        profile.setRating(0.0);
        profile.setTotalReviews(0);
        return profile;
    }

    // Apply UpdateProfileRequestDto fields onto existing entity
    public void updateEntity(UserProfile profile, UpdateProfileRequestDto request) {
        // Only update username if it's provided and not blank
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            profile.setUsername(request.getUsername());
        }
        
        profile.setName(request.getName());
        profile.setBio(request.getBio());
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setSkills(request.getSkills());
        
        profile.setProfileComplete(
                request.getName() != null &&
                request.getSkills() != null &&
                !request.getSkills().isEmpty()
        );
    }

    // UserProfile entity -> UserProfileResponseDto
    public UserProfileResponseDto toDto(UserProfile profile) {
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUserId());
        dto.setEmail(profile.getEmail());
        
        // Fallback to email prefix if username in DB is somehow null or blank
        boolean hasUsername = profile.getUsername() != null && !profile.getUsername().trim().isEmpty();
        dto.setUsername(hasUsername ? profile.getUsername() : profile.getEmail().split("@")[0]);
        
        dto.setName(profile.getName());
        dto.setBio(profile.getBio());
        dto.setPhoneNumber(profile.getPhoneNumber());
        dto.setProfileImageUrl(profile.getProfileImageUrl());
        dto.setSkills(profile.getSkills());
        dto.setRating(profile.getRating());
        dto.setTotalReviews(profile.getTotalReviews());
        dto.setIsProfileComplete(profile.getProfileComplete());
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setUpdatedAt(profile.getUpdatedAt());
        return dto;
    }
}

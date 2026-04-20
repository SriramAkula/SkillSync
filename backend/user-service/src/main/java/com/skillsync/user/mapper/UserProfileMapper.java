package com.skillsync.user.mapper;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.dto.response.UserProfileAdminResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.client.AuthClient;
import com.skillsync.user.client.ReviewClient;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserProfileMapper {
    
    private final AuthClient authClient;
    private final ReviewClient reviewClient;

    // userId + email + username -> new UserProfile entity (backward compatibility)
    public UserProfile toEntity(Long userId, String email, String username) {
        return toEntity(userId, email, username, null, "ROLE_LEARNER");
    }

    // userId + email + username + name + role -> new UserProfile entity (on registration)
    public UserProfile toEntity(Long userId, String email, String username, String name, String role) {
        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        profile.setEmail(email);
        profile.setName(name);
        profile.setRole(role);
        
        // Ensure username is never blank on creation
        boolean hasUsername = username != null && !username.trim().isEmpty();
        profile.setUsername(hasUsername ? username : email.split("@")[0]);
        
        profile.setProfileComplete(name != null && !name.trim().isEmpty());
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

    // UserProfile entity -> UserProfileResponseDto (PUBLIC - no blocking fields)
    public UserProfileResponseDto toDto(UserProfile profile) {
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUserId());
        dto.setEmail(profile.getEmail());
        
        // Fallback to email prefix if username in DB is somehow null or blank
        boolean hasUsername = profile.getUsername() != null && !profile.getUsername().trim().isEmpty();
        dto.setUsername(hasUsername ? profile.getUsername() : profile.getEmail().split("@")[0]);
        
        dto.setRole(profile.getRole());
        dto.setName(profile.getName());
        dto.setBio(profile.getBio());
        dto.setPhoneNumber(profile.getPhoneNumber());
        dto.setProfileImageUrl(profile.getProfileImageUrl());
        dto.setResumeUrl(profile.getResumeUrl());
        dto.setSkills(profile.getSkills());
        dto.setRating(profile.getRating());
        dto.setTotalReviews(profile.getTotalReviews());
        dto.setIsProfileComplete(profile.getProfileComplete());
        dto.setIsBlocked(profile.getIsBlocked());
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setUpdatedAt(profile.getUpdatedAt());
        
        return dto;
    }

    // UserProfile entity -> UserProfileAdminResponseDto (ADMIN-ONLY - with blocking fields)
    public UserProfileAdminResponseDto toAdminDto(UserProfile profile) {
        UserProfileAdminResponseDto dto = new UserProfileAdminResponseDto();
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
        // Fetch rating and total reviews from Review Service in real-time
        try {
            log.debug("Fetching real-time rating for mentor: {}", profile.getUserId());
            com.skillsync.user.dto.response.ApiResponse<com.skillsync.user.dto.internal.MentorRatingDto> ratingResponse = 
                reviewClient.getMentorRating(profile.getUserId());
            
            if (ratingResponse != null && ratingResponse.isSuccess() && ratingResponse.getData() != null) {
                dto.setRating(ratingResponse.getData().getAverageRating());
                dto.setTotalReviews(ratingResponse.getData().getTotalReviews());
                log.debug("   Rating enriched: {} ({} reviews)", dto.getRating(), dto.getTotalReviews());
            } else {
                // Fallback to local entity values
                dto.setRating(profile.getRating());
                dto.setTotalReviews(profile.getTotalReviews());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch real-time rating for user {} from Review Service: {}", profile.getUserId(), e.getMessage());
            // Fallback to local entity values
            dto.setRating(profile.getRating());
            dto.setTotalReviews(profile.getTotalReviews());
        }

        dto.setIsProfileComplete(profile.getProfileComplete());

        // Fetch roles from Auth Service via Feign
        Set<String> roles = new java.util.HashSet<>();
        try {
            log.debug("Fetching roles for user {} from Auth Service", profile.getUserId());
            roles = authClient.getUserRoles(profile.getUserId());
            log.debug("   Roles retrieved: {}", roles);
        } catch (Exception e) {
            log.error("CRITICAL: Failed to fetch roles for user {} from Auth Service: {}", profile.getUserId(), e.getMessage());
            // Fallback to empty set if Auth Service is unavailable
        }
        dto.setRoles(roles != null && !roles.isEmpty() ? roles : java.util.Collections.emptySet());
        
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setUpdatedAt(profile.getUpdatedAt());
        
        // Blocking fields (admin-only)
        dto.setIsBlocked(profile.getIsBlocked());
        dto.setBlockReason(profile.getBlockReason());
        dto.setBlockDate(profile.getBlockDate());
        dto.setBlockedBy(profile.getBlockedBy());
        
        return dto;
    }
}

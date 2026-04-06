package com.skillsync.user.dto.response;

import java.time.LocalDateTime;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin-only response DTO with blocking information
 * Only returned by /admin/** endpoints
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileAdminResponseDto {

	private Long id;
	private Long userId;
	private String username;
	private String email;
	private String name;
	private String bio;
	private String phoneNumber;
	private String profileImageUrl;
	private String skills;
	private Double rating;
	private Integer totalReviews;
	private Boolean isProfileComplete;
	private Set<String> roles;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
	
	// ─── Blocking Fields (Admin Only) ────────────────────────────────────
	private Boolean isBlocked;
	private String blockReason;
	private LocalDateTime blockDate;
	private Long blockedBy;
}

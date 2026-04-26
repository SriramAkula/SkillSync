package com.skillsync.user.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * User Profile Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto {

	private Long id;
	private Long userId;
	private String username;
	private String email;
	private String role;
	private String name;
	private String bio;
	private String phoneNumber;
	private String profileImageUrl;
	private String skills;
	private Double rating;
	private Integer totalReviews;
	private Boolean isProfileComplete;
	private Boolean isBlocked;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Kolkata")
	private LocalDateTime createdAt;
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Kolkata")
	private LocalDateTime updatedAt;
}

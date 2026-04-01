package com.skillsync.user.service;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import java.util.Map;

/**
 * User Profile Service Interface
 */
public interface UserProfileService {

	/**
	 * Get profile by userId
	 */
	UserProfileResponseDto getProfileByUserId(Long userId);

	/**
	 * Update user profile
	 */
	UserProfileResponseDto updateProfile(Long userId, UpdateProfileRequestDto requestDto);

	/**
	 * Get profile by email
	 */
	UserProfileResponseDto getProfileByEmail(String email);

	/**
	 * Update user profile by email
	 */
	UserProfileResponseDto updateProfileByEmail(String email, UpdateProfileRequestDto requestDto);

	/**
	 * Create user profile from internal endpoint (Auth Service)
	 */
	void createProfile(Long userId, String email, String username);
}

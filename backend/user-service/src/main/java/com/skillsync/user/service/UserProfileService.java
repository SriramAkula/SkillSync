package com.skillsync.user.service;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import org.springframework.web.multipart.MultipartFile;
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

	boolean existsByUsername(String username);

	/**
	 * Get profile by email
	 */
	UserProfileResponseDto getProfileByEmail(String email);

	/**
	 * Create user profile from internal endpoint (Auth Service)
	 */
	/**
	 * Create user profile from internal endpoint (Auth Service) - backward compatibility
	 */
	void createProfile(Long userId, String email, String username);

	/**
	 * Create user profile from internal endpoint (Auth Service)
	 */
	void createProfile(Long userId, String email, String username, String name, String role);

	/**
	 * Upload Profile Image
	 */
	UserProfileResponseDto uploadProfileImage(Long userId, MultipartFile file);

	/**
	 * Upload Resume
	 */
	void uploadResume(Long userId, MultipartFile file);

	/**
	 * Get pre-signed resume URL
	 */
	String getResumeUrl(Long userId);
}

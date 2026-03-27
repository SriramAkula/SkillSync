package com.skillsync.user.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.repository.UserProfileRepository;
import com.skillsync.user.service.UserProfileService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

/**
 * User Profile Service Implementation
 */
@Service
@RequiredArgsConstructor
@Slf4j
@CacheConfig(cacheNames = "user")
public class UserProfileServiceImpl implements UserProfileService {

	private final UserProfileRepository userProfileRepository;

	@Override
	@Cacheable(key = "'userId_' + #userId")
	public UserProfileResponseDto getProfileByUserId(Long userId) {
		log.info("Cache MISS — fetching profile for userId={} from DB", userId);

		UserProfile profile = userProfileRepository.findByUserId(userId)
			.orElseThrow(() -> new UserProfileNotFoundException(
				"User profile not found for userId: " + userId
			));

		return mapToResponseDto(profile);
	}

	@Override
	@Transactional
	@CacheEvict(allEntries = true)
	public UserProfileResponseDto updateProfile(Long userId, UpdateProfileRequestDto requestDto) {
		log.info("Updating profile for userId: {}", userId);

		UserProfile profile = userProfileRepository.findByUserId(userId)
			.orElseThrow(() -> new UserProfileNotFoundException(
				"User profile not found for userId: " + userId
			));

		// Update profile fields
		profile.setName(requestDto.getName());
		profile.setBio(requestDto.getBio());
		profile.setPhoneNumber(requestDto.getPhoneNumber());
		profile.setSkills(requestDto.getSkills());
		
		// Mark profile as complete if it has minimum required fields
		profile.setProfileComplete(
			profile.getName() != null && 
			profile.getSkills() != null && 
			!profile.getSkills().isEmpty()
		);

		UserProfile updatedProfile = userProfileRepository.save(profile);
		log.info("Profile updated successfully for userId: {}", userId);

		return mapToResponseDto(updatedProfile);
	}

	@Override
	@Transactional
	public void createProfile(Long userId, String email) {
		log.info("Creating profile for userId: {}, email: {}", userId, email);

		UserProfile profile = new UserProfile();
		profile.setUserId(userId);
		profile.setEmail(email);
		profile.setProfileComplete(false);
		profile.setRating(0.0);
		profile.setTotalReviews(0);

		userProfileRepository.save(profile);
		log.info("UserProfile created successfully for userId: {}", userId);
	}

	@Override
	@Cacheable(key = "'email_' + #email")
	public UserProfileResponseDto getProfileByEmail(String email) {
		log.info("Cache MISS — fetching profile for email={} from DB", email);

		UserProfile profile = userProfileRepository.findByEmail(email)
			.orElseThrow(() -> new UserProfileNotFoundException(
				"User profile not found for email: " + email
			));

		return mapToResponseDto(profile);
	}

	// =============================================
	// HELPER METHODS
	// =============================================

	private UserProfileResponseDto mapToResponseDto(UserProfile profile) {
		UserProfileResponseDto dto = new UserProfileResponseDto();
		dto.setId(profile.getId());
		dto.setUserId(profile.getUserId());
		dto.setEmail(profile.getEmail());
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

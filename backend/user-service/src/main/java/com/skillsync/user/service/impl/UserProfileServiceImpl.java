package com.skillsync.user.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.mapper.UserProfileMapper;
import com.skillsync.user.repository.UserProfileRepository;
import com.skillsync.user.service.UserProfileService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;

@Service
@RequiredArgsConstructor
@Slf4j
@CacheConfig(cacheNames = "user")
public class UserProfileServiceImpl implements UserProfileService {

	private final UserProfileRepository userProfileRepository;
	private final UserProfileMapper userProfileMapper;

	@Override
	@Cacheable(key = "'userId_' + #userId")
	public UserProfileResponseDto getProfileByUserId(Long userId) {
		log.info("Cache MISS - fetching profile for userId={} from DB", userId);
		UserProfile profile = userProfileRepository.findByUserId(userId)
			.orElseThrow(() -> new UserProfileNotFoundException(
				"User profile not found for userId: " + userId));
		return userProfileMapper.toDto(profile);
	}

	@Override
	@Transactional
	@Caching(evict = {
		@CacheEvict(key = "'userId_' + #userId"),
		@CacheEvict(key = "'email_' + #result.email", condition = "#result != null")
	}, put = {
		@CachePut(key = "'userId_' + #userId")
	})
	public UserProfileResponseDto updateProfile(Long userId, UpdateProfileRequestDto requestDto) {
		log.info("Updating profile for userId: {}", userId);
		UserProfile profile = userProfileRepository.findByUserId(userId)
			.orElseThrow(() -> new UserProfileNotFoundException(
				"User profile not found for userId: " + userId));
		userProfileMapper.updateEntity(profile, requestDto);
		UserProfile updated = userProfileRepository.save(profile);
		log.info("Profile updated successfully for userId: {}", userId);
		return userProfileMapper.toDto(updated);
	}

	@Override
	@Transactional
	@Caching(evict = {
		@CacheEvict(key = "'userId_' + #result.userId", condition = "#result != null"),
		@CacheEvict(key = "'email_' + #email")
	}, put = {
		@CachePut(key = "'email_' + #email")
	})
	public UserProfileResponseDto updateProfileByEmail(String email, UpdateProfileRequestDto requestDto) {
		log.info("Updating profile for email: {}", email);
		UserProfile profile = userProfileRepository.findByEmail(email)
			.orElseThrow(() -> new UserProfileNotFoundException(
				"User profile not found for email: " + email));
		userProfileMapper.updateEntity(profile, requestDto);
		UserProfile updated = userProfileRepository.save(profile);
		log.info("Profile updated successfully for email: {}", email);
		return userProfileMapper.toDto(updated);
	}

	@Override
	@Transactional
	public void createProfile(Long userId, String email, String username) {
		log.info("Creating profile for userId: {}, email: {}, username: {}", userId, email, username);
		UserProfile profile = userProfileMapper.toEntity(userId, email, username);
		userProfileRepository.save(profile);
		log.info("UserProfile created successfully for userId: {}", userId);
	}

	@Override
	@Cacheable(key = "'email_' + #email")
	public UserProfileResponseDto getProfileByEmail(String email) {
		log.info("Cache MISS - fetching profile for email={} from DB", email);
		UserProfile profile = userProfileRepository.findByEmail(email)
			.orElseThrow(() -> new UserProfileNotFoundException(
				"User profile not found for email: " + email));
		return userProfileMapper.toDto(profile);
	}
}

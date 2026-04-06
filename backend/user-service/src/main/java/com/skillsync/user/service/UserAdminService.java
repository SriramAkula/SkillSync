package com.skillsync.user.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.dto.response.UserProfileAdminResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.mapper.UserProfileMapper;
import com.skillsync.user.repository.UserProfileRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin Service for User Management
 * Handles user blocking, unblocking, and user listing
 * All methods return UserProfileAdminResponseDto (admin-only with blocking info)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserAdminService {

	private final UserProfileRepository userProfileRepository;
	private final UserProfileMapper userProfileMapper;
	private final com.skillsync.user.client.AuthClient authClient;

	/**
	 * Get all users with pagination (admin-only, returns blocking info)
	 */
	public Page<UserProfileAdminResponseDto> getAllUsers(int page, int size) {
		log.info("Fetching all users - page: {}, size: {}", page, size);
		
		Pageable pageable = PageRequest.of(page, size);
		Page<UserProfile> users = userProfileRepository.findAll(pageable);
		
		return users.map(userProfileMapper::toAdminDto);
	}

	/**
	 * Get all blocked users (admin-only)
	 */
	public List<UserProfileAdminResponseDto> getBlockedUsers() {
		log.info("Fetching all blocked users");
		
		List<UserProfile> blockedUsers = userProfileRepository.findByIsBlockedTrue();
		return blockedUsers.stream()
			.map(userProfileMapper::toAdminDto)
			.collect(Collectors.toList());
	}

	/**
	 * Block a user (admin-only)
	 * 
	 * @param userId User to block
	 * @param reason Reason for blocking
	 * @param adminId Admin performing the action
	 * @return Updated profile with blocking info
	 */
	public UserProfileAdminResponseDto blockUser(Long userId, String reason, Long adminId) {
		log.info("Admin {} blocking user {}", adminId, userId);
		
		UserProfile user = userProfileRepository.findByUserId(userId)
			.orElseThrow(() -> new UserProfileNotFoundException("User not found with ID: " + userId));

		if (user.getIsBlocked()) {
			log.warn("User {} is already blocked", userId);
			return userProfileMapper.toAdminDto(user);
		}

		user.setIsBlocked(true);
		user.setBlockReason(reason);
		user.setBlockDate(LocalDateTime.now());
		user.setBlockedBy(adminId);

		UserProfile saved = userProfileRepository.save(user);
		log.info("User {} successfully blocked by admin {}", userId, adminId);
		
		// ── Sync status with Auth Service ──
		try {
			authClient.updateUserStatus(userId, false);
			log.info("Successfully synced block status to Auth Service for user {}", userId);
		} catch (Exception e) {
			log.error("Failed to sync block status to Auth Service for user {}: {}", userId, e.getMessage());
		}
		
		return userProfileMapper.toAdminDto(saved);
	}

	/**
	 * Unblock a user (admin-only)
	 * 
	 * @param userId User to unblock
	 * @param adminId Admin performing the action
	 * @return Updated profile with blocking info cleared
	 */
	public UserProfileAdminResponseDto unblockUser(Long userId, Long adminId) {
		log.info("Admin {} unblocking user {}", adminId, userId);
		
		UserProfile user = userProfileRepository.findByUserId(userId)
			.orElseThrow(() -> new UserProfileNotFoundException("User not found with ID: " + userId));

		if (!user.getIsBlocked()) {
			log.warn("User {} is not blocked", userId);
			return userProfileMapper.toAdminDto(user);
		}

		user.setIsBlocked(false);
		user.setBlockReason(null);
		user.setBlockDate(null);
		user.setBlockedBy(null);

		UserProfile saved = userProfileRepository.save(user);
		log.info("User {} successfully unblocked by admin {}", userId, adminId);

		// ── Sync status with Auth Service ──
		try {
			authClient.updateUserStatus(userId, true);
			log.info("Successfully synced unblock status to Auth Service for user {}", userId);
		} catch (Exception e) {
			log.error("Failed to sync unblock status to Auth Service for user {}: {}", userId, e.getMessage());
		}
		
		return userProfileMapper.toAdminDto(saved);
	}

	/**
	 * Get user details with blocking info (admin-only)
	 */
	public UserProfileAdminResponseDto getUserDetails(Long userId) {
		log.info("Fetching user details for userId: {}", userId);
		
		UserProfile user = userProfileRepository.findByUserId(userId)
			.orElseThrow(() -> new UserProfileNotFoundException("User not found with ID: " + userId));
		
		return userProfileMapper.toAdminDto(user);
	}
}

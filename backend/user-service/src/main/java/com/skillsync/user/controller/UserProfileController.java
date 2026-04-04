package com.skillsync.user.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.ApiResponse;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.service.UserProfileService;
import com.skillsync.user.util.SecurityContextUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * User Profile Controller
 * Handles user profile management
 */
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Profile", description = "User profile management and retrieval")
public class UserProfileController {

	private final UserProfileService userProfileService;
	private final SecurityContextUtil securityUtil;

	/**
	 * GET /api/user/profile
	 * Get user's own profile
	 */
	@GetMapping("/profile")
	@Operation(summary = "Get current user profile", description = "Retrieve the profile of the authenticated user")
	@ApiResponses(value = {
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile fetched successfully"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User profile not found")
	})
	@SecurityRequirement(name = "bearerAuth")
	public ResponseEntity<ApiResponse<UserProfileResponseDto>> getProfile(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long headerUserId,
			@Parameter(hidden = true) @RequestHeader(value = "loggedInUser", required = false) String headerEmail,
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			HttpServletRequest request) {

		// 1. Robust identification from JWT
		Long userId = securityUtil.extractUserId(request);
		String email = securityUtil.extractEmail(request);
		
		// Fallback to headers (only if secure/internal)
		if (userId == null) userId = headerUserId;
		if (email == null) email = headerEmail;

		if (userId == null && (email == null || email.isEmpty())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unidentified user");
		}
		log.info("Fetching profile for userId: {} (fallback email: {})", userId, email);

		UserProfileResponseDto response;
		try {
			response = userProfileService.getProfileByUserId(userId);
		} catch (Exception e) {
			if (email != null && !email.trim().isEmpty()) {
				log.info("Profile not found by userId, attempting fallback with email: {}", email);
				response = userProfileService.getProfileByEmail(email);
			} else {
				throw e;
			}
		}

		return ResponseEntity
				.ok(new ApiResponse<>(
						"Profile fetched successfully",
						response));
	}

	/**
	 * GET /api/user/profile/{userId}
	 * Get any user's profile (public view)
	 */
	@GetMapping("/profile/{userId}")
	@Operation(summary = "Get user profile by ID", description = "Retrieve the profile of any user (public view)")
	@ApiResponses(value = {
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile fetched successfully"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User profile not found")
	})
	public ResponseEntity<ApiResponse<UserProfileResponseDto>> getUserProfile(
			@PathVariable Long userId) {

		log.info("Fetching public profile for userId: {}", userId);

		UserProfileResponseDto response;
		try {
			response = userProfileService.getProfileByUserId(userId);
		} catch (Exception e) {
			log.warn("Public profile for userId={} not found. Returning placeholder.", userId);
			UserProfileResponseDto placeholder = new UserProfileResponseDto();
			placeholder.setUserId(userId);
			placeholder.setUsername("User " + userId);
			placeholder.setName("Unknown User");
			placeholder.setEmail("unknown@skillsync.com");
			placeholder.setBio("Profile details are currently unavailable.");
			response = placeholder;
		}

		return ResponseEntity
				.ok(new ApiResponse<>(
						"Profile fetched successfully",
						response));
	}

	/**
	 * PUT /api/user/profile
	 * Update user's profile
	 */
	@PutMapping("/profile")
	@Operation(summary = "Update user profile", description = "Update the profile of the authenticated user")
	@ApiResponses(value = {
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile updated successfully"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User profile not found")
	})
	@SecurityRequirement(name = "bearerAuth")
	public ResponseEntity<ApiResponse<UserProfileResponseDto>> updateProfile(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long headerUserId,
			@Parameter(hidden = true) @RequestHeader(value = "loggedInUser", required = false) String headerEmail,
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			@Valid @RequestBody UpdateProfileRequestDto requestDto,
			HttpServletRequest request) {

		// 1. Robust identification from JWT
		Long userId = securityUtil.extractUserId(request);
		String email = securityUtil.extractEmail(request);
		
		// Fallback to headers (only if secure/internal)
		if (userId == null) userId = headerUserId;
		if (email == null) email = headerEmail;

		if (userId == null && (email == null || email.isEmpty())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unidentified user");
		}

		log.info("Updating profile for userId: {} (email: {})", userId, email);

		UserProfileResponseDto response;
		try {
			if (userId != null) {
				response = userProfileService.updateProfile(userId, requestDto);
			} else {
				// We have email but no ID (possibly older OAuth token format)
				UserProfileResponseDto existing = userProfileService.getProfileByEmail(email);
				response = userProfileService.updateProfile(existing.getUserId(), requestDto);
			}
		} catch (Exception e) {
			if (email != null && !email.trim().isEmpty()) {
				log.info("Profile update retry by email: {}", email);
				UserProfileResponseDto profileByEmail = userProfileService.getProfileByEmail(email);
				response = userProfileService.updateProfile(profileByEmail.getUserId(), requestDto);
			} else {
				throw e;
			}
		}

		return ResponseEntity
				.ok(new ApiResponse<>(
						"Profile updated successfully",
						response));
	}

	/**
	 * POST /user/internal/users
	 * Internal endpoint for creating profile after registration
	 * Called by Auth Service via Feign
	 * Accepts userId, email, username - password is NOT stored here
	 */
	@PostMapping("/internal/users")
	public ResponseEntity<Void> createUserProfile(
			@RequestBody java.util.Map<String, Object> userData) {

		try {
			// Safer extraction with null checks
			if (userData == null || userData.isEmpty()) {
				log.error("Empty or null userData received");
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
			}

			Object userIdObj = userData.get("userId");
			if (userIdObj == null) {
				log.error("userId is null in userData");
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
			}

			Long userId = ((Number) userIdObj).longValue();
			String email = (String) userData.get("email");
			String username = (String) userData.get("username");

			if (userId == null || email == null) {
				log.error("Missing required fields: userId={}, email={}", userId, email);
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
			}

			log.info("Creating user profile for userId: {} with email: {}, username: {}", userId, email, username);

			// Check if profile already exists
			try {
				if (userProfileService.getProfileByUserId(userId) != null) {
					log.warn("UserProfile already exists for userId: {}", userId);
					return ResponseEntity.ok().build();
				}
			} catch (Exception e) {
				// Profile doesn't exist, proceed with creation
			}

			// Create new UserProfile via service
			userProfileService.createProfile(userId, email, username);
			log.info("UserProfile created successfully for userId: {}", userId);

			return ResponseEntity.status(HttpStatus.CREATED).build();

		} catch (NullPointerException e) {
			log.error("NullPointerException creating user profile: {}", e.getMessage());
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
		} catch (Exception e) {
			log.error("Error creating user profile: {}", e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	/**
	 * GET /internal/users/{userId}
	 * Internal endpoint for service-to-service communication (bypasses gateway filter)
	 */
	@GetMapping("/internal/users/{userId}")
	@Operation(summary = "Internal endpoint: Get user profile", description = "Internal service-to-service endpoint for fetching user profile")
	public ResponseEntity<ApiResponse<UserProfileResponseDto>> getInternalUserProfile(
			@PathVariable Long userId) {

		log.info("Internal: Fetching profile for userId: {}", userId);

		UserProfileResponseDto response = userProfileService.getProfileByUserId(userId);

		return ResponseEntity
				.ok(new ApiResponse<>(
						"Profile fetched successfully",
						response));
	}

}

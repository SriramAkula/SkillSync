package com.skillsync.user.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.request.BlockUserRequest;
import com.skillsync.user.dto.response.ApiResponse;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.dto.response.UserProfileAdminResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.service.UserProfileService;
import com.skillsync.user.service.UserAdminService;
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
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
			@Parameter(hidden = true) @RequestHeader(value = "loggedInUser", required = false) String headerEmail,
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			HttpServletRequest request) {

		if (roles == null || roles.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing roles");
		}

		Long userId = securityUtil.extractUserId(request);
		if (userId == null) userId = headerUserId;

		if (userId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unidentified user");
		}

		log.info("Fetching profile for userId: {}", userId);
		UserProfileResponseDto response = userProfileService.getProfileByUserId(userId);

		return ResponseEntity
				.ok(new ApiResponse<>(
						true,
						"Profile fetched successfully",
						response,
						200));
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
		UserProfileResponseDto response = userProfileService.getProfileByUserId(userId);

		return ResponseEntity
				.ok(new ApiResponse<>(
						true,
						"Profile fetched successfully",
						response,
						200));
	}

	/**
	 * GET /api/user/exists/{username}
	 * Check if a username already exists
	 */
	@GetMapping("/exists/{username}")
	@Operation(summary = "Check username existence", description = "Check if a username is already taken by another user")
	public ResponseEntity<ApiResponse<Boolean>> checkUsernameExists(@PathVariable String username) {
		log.info("Checking existence for username: {}", username);
		boolean exists = userProfileService.existsByUsername(username);
		return ResponseEntity.ok(new ApiResponse<>(true, "Username check completed", exists, 200));
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
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			@Valid @RequestBody UpdateProfileRequestDto requestDto,
			HttpServletRequest request) {

		if (roles == null || roles.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing roles");
		}

		Long userId = securityUtil.extractUserId(request);
		if (userId == null) userId = headerUserId;

		if (userId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unidentified user");
		}

		log.info("Updating profile for userId: {}", userId);
		UserProfileResponseDto response = userProfileService.updateProfile(userId, requestDto);

		return ResponseEntity
				.ok(new ApiResponse<>(
						true,
						"Profile updated successfully",
						response,
						200));
	}

	/**
	 * POST /api/user/profile/image
	 * Upload user's profile image
	 */
	@PostMapping(value = "/profile/image", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "Upload profile picture", description = "Upload a profile picture for the authenticated user")
	@SecurityRequirement(name = "bearerAuth")
	public ResponseEntity<ApiResponse<UserProfileResponseDto>> uploadProfileImage(
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
			@RequestParam("file") org.springframework.web.multipart.MultipartFile file,
			HttpServletRequest request) {

		Long userId = securityUtil.extractUserId(request);
		if (userId == null) userId = headerUserId;

		if (userId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unidentified user");
		}

		log.info("Uploading profile image for userId: {}", userId);
		UserProfileResponseDto response = userProfileService.uploadProfileImage(userId, file);

		return ResponseEntity.ok(new ApiResponse<>(true, "Profile image uploaded successfully", response, 200));
	}


	/**
	 * POST /user/internal/users
	 * Internal endpoint for creating profile after registration
	 * Called by Auth Service via Feign
	 * Accepts userId, email, username - password is NOT stored here
	 */
	@PostMapping("/internal/users")
	public ResponseEntity<Void> createUserProfile(
			@RequestBody(required = false) java.util.Map<String, Object> userData) {

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
			String name = (String) userData.get("name");
			String role = (String) userData.get("role");

			if (email == null) {
				log.error("Missing required fields: userId={}, email={}", userId, email);
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
			}

			log.info("Creating user profile for userId: {} with email: {}, username: {}, role: {}", userId, email, username, role);

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
			if (name == null && role == null) {
				userProfileService.createProfile(userId, email, username);
			} else {
				userProfileService.createProfile(userId, email, username, name, role);
			}
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
						true,
						"Profile fetched successfully",
						response,
						200));
	}

	// ─────────────────────────────────────────────────────────────
	// ──── ADMIN ENDPOINTS ────────────────────────────────────────
	// ─────────────────────────────────────────────────────────────

	private final UserAdminService userAdminService;

	/**
	 * GET /api/user/admin/all?page=0&size=20
	 * Get all users with pagination (Admin only)
	 */
	@GetMapping("/admin/all")
	@Operation(summary = "Get all users", description = "Retrieve list of all users (Admin only)")
	@ApiResponses(value = {
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Users fetched successfully"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only admins can access this"),
	})
	public ResponseEntity<ApiResponse<Object>> getAllUsers(
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {

		if (roles == null || !roles.contains("ROLE_ADMIN")) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can access this endpoint");
		}

		log.info("Admin: Fetching all users - page: {}, size: {}", page, size);
		Object response = userAdminService.getAllUsers(page, size);

		return ResponseEntity
				.ok(new ApiResponse<>(
						true,
						"Users fetched successfully",
						response,
						200));
	}

	/**
	 * GET /api/user/admin/blocked
	 * Get all blocked users (Admin only)
	 */
	@GetMapping("/admin/blocked")
	@Operation(summary = "Get blocked users", description = "Retrieve list of all blocked users (Admin only)")
	@ApiResponses(value = {
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Blocked users fetched successfully"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only admins can access this"),
	})
	public ResponseEntity<ApiResponse<Object>> getBlockedUsers(
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

		if (roles == null || !roles.contains("ROLE_ADMIN")) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can access this endpoint");
		}

		log.info("Admin: Fetching blocked users");
		Object response = userAdminService.getBlockedUsers();

		return ResponseEntity
				.ok(new ApiResponse<>(
						true,
						"Blocked users fetched successfully",
						response,
						200));
	}

	/**
	 * PUT /api/user/admin/{userId}/block
	 * Block a user (Admin only)
	 */
	@PutMapping("/admin/{userId}/block")
	@Operation(summary = "Block user", description = "Block a user account (Admin only)")
	@ApiResponses(value = {
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User blocked successfully"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only admins can access this"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
	})
	public ResponseEntity<ApiResponse<UserProfileAdminResponseDto>> blockUser(
			@PathVariable Long userId,
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long adminId,
			@RequestBody BlockUserRequest request) {

		if (roles == null || !roles.contains("ROLE_ADMIN")) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can block users");
		}

		log.info("Admin {} blocking user {}", adminId, userId);
		UserProfileAdminResponseDto response = userAdminService.blockUser(userId, request.getReason(), adminId);

		return ResponseEntity
				.ok(new ApiResponse<>(
						true,
						"User blocked successfully",
						response,
						200));
	}

	/**
	 * PUT /api/user/admin/{userId}/unblock
	 * Unblock a user (Admin only)
	 */
	@PutMapping("/admin/{userId}/unblock")
	@Operation(summary = "Unblock user", description = "Unblock a user account (Admin only)")
	@ApiResponses(value = {
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User unblocked successfully"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only admins can access this"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
	})
	public ResponseEntity<ApiResponse<UserProfileAdminResponseDto>> unblockUser(
			@PathVariable Long userId,
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long adminId) {

		if (roles == null || !roles.contains("ROLE_ADMIN")) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can unblock users");
		}

		log.info("Admin {} unblocking user {}", adminId, userId);
		UserProfileAdminResponseDto response = userAdminService.unblockUser(userId, adminId);

		return ResponseEntity
				.ok(new ApiResponse<>(
						true,
						"User unblocked successfully",
						response,
						200));
	}

	/**
	 * GET /api/user/admin/{userId}/details
	 * Get user details (Admin only)
	 */
	@GetMapping("/admin/{userId}/details")
	@Operation(summary = "Get user details", description = "Get detailed information about a user (Admin only)")
	@ApiResponses(value = {
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User details fetched successfully"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only admins can access this"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
	})
	public ResponseEntity<ApiResponse<UserProfileAdminResponseDto>> getUserDetails(
			@PathVariable Long userId,
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

		if (roles == null || !roles.contains("ROLE_ADMIN")) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can access this endpoint");
		}

		log.info("Admin: Fetching user details for userId: {}", userId);
		UserProfileAdminResponseDto response = userAdminService.getUserDetails(userId);

		return ResponseEntity
				.ok(new ApiResponse<>(
						true,
						"User details fetched successfully",
						response,
						200));
	}

}


package com.skillsync.mentor.controller;

import com.skillsync.mentor.dto.ApiResponse;
import com.skillsync.mentor.dto.PageResponse;
import com.skillsync.mentor.dto.request.ApplyMentorRequestDto;
import com.skillsync.mentor.dto.request.UpdateAvailabilityRequestDto;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.service.MentorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/mentor")
@Tag(name = "Mentor Management", description = "Mentor profile and application management")
public class MentorController {

    private static final Logger log = LoggerFactory.getLogger(MentorController.class);
    private final MentorService mentorService;

    public MentorController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @PostMapping("/apply")
    @Operation(summary = "Apply as mentor", description = "Submit mentor application with skills and experience")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Mentor application submitted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ApiResponse<MentorProfileResponseDto>> applyAsMentor(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
            @Valid @RequestBody ApplyMentorRequestDto request) {

        if (roles == null || (!roles.contains("ROLE_LEARNER") && !roles.contains("ROLE_MENTOR"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners or mentors can apply to be mentors");
        }
        log.info("POST /apply - User {}", userId);
        MentorProfileResponseDto response = mentorService.applyAsMentor(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<MentorProfileResponseDto>builder()
                        .success(true)
                        .data(response)
                        .message("Mentor application submitted successfully")
                        .statusCode(201)
                        .build());
    }

    @GetMapping("/{mentorId}")
    @Operation(summary = "Get mentor profile", description = "Retrieve mentor profile details by mentor ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Mentor profile retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Mentor not found")
    })
    public ResponseEntity<ApiResponse<MentorProfileResponseDto>> getMentorProfile(
            @PathVariable Long mentorId) {
        log.info("GET /{} - Get mentor profile", mentorId);
        MentorProfileResponseDto response = mentorService.getMentorProfile(mentorId);
        return ResponseEntity.ok(ApiResponse.<MentorProfileResponseDto>builder()
                .success(true)
                .data(response)
                .message("Mentor profile retrieved successfully")
                .statusCode(200)
                .build());
    }

    @GetMapping("/profile/me")
    @Operation(summary = "Get my mentor profile", description = "Retrieve current user's mentor profile")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Your mentor profile retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Mentor profile not found")
    })
    public ResponseEntity<ApiResponse<MentorProfileResponseDto>> getMyMentorProfile(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {
        log.info("GET /profile/me - User {}", userId);
        MentorProfileResponseDto response = mentorService.getMentorByUserId(userId);
        return ResponseEntity.ok(ApiResponse.<MentorProfileResponseDto>builder()
                .success(true)
                .data(response)
                .message("Your mentor profile retrieved successfully")
                .statusCode(200)
                .build());
    }

    @GetMapping("/approved")
    @Operation(summary = "Get all approved mentors", description = "Retrieve list of all approved mentors")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Approved mentors retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ApiResponse<PageResponse<MentorProfileResponseDto>>> getAllApprovedMentors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        log.info("GET /approved - Get all approved mentors - page: {}, size: {}", page, size);
        PageResponse<MentorProfileResponseDto> response = mentorService.getAllApprovedMentors(page, size);
        return ResponseEntity.ok(ApiResponse.<PageResponse<MentorProfileResponseDto>>builder()
                .success(true)
                .data(response)
                .message("Approved mentors retrieved successfully")
                .statusCode(200)
                .build());
    }

    @GetMapping("/pending")
    @Operation(summary = "Get pending mentor applications", description = "Retrieve list of pending mentor applications (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Pending applications retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only admins can view pending applications"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ApiResponse<PageResponse<MentorProfileResponseDto>>> getPendingApplications(
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        log.info("GET /pending - Get pending mentor applications - page: {}, size: {}", page, size);
        if (role == null || !role.contains("ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can view pending applications");
        }
        PageResponse<MentorProfileResponseDto> response = mentorService.getPendingApplications(page, size);
        return ResponseEntity.ok(ApiResponse.<PageResponse<MentorProfileResponseDto>>builder()
                .success(true)
                .data(response)
                .message("Pending applications retrieved successfully")
                .statusCode(200)
                .build());
    }

    @GetMapping("/search")
    @Operation(summary = "Search mentors with filters", description = "Search and filter mentors by skill, experience, rate, and rating")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Mentors found successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid search parameters")
    })
    public ResponseEntity<ApiResponse<PageResponse<MentorProfileResponseDto>>> searchMentors(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(required = false) Integer maxExperience,
            @RequestParam(required = false) Double maxRate,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        log.info("GET /search?skill={}&minExp={}&maxExp={}&maxRate={}&minRating={}&page={}&size={}", skill, minExperience, maxExperience, maxRate, minRating, page, size);
        PageResponse<MentorProfileResponseDto> response = mentorService.searchMentorsWithFilters(skill, minExperience, maxExperience, maxRate, minRating, page, size);
        return ResponseEntity.ok(ApiResponse.<PageResponse<MentorProfileResponseDto>>builder()
                .success(true)
                .data(response)
                .message("Mentors found successfully")
                .statusCode(200)
                .build());
    }

    @PutMapping("/{mentorId}/approve")
    public ResponseEntity<ApiResponse<MentorProfileResponseDto>> approveMentor(
            @PathVariable Long mentorId,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long adminId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String role) {
        log.info("PUT /{}/approve - Admin {}", mentorId, adminId);
        if (role == null || !role.contains("ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can approve mentors");
        }
        MentorProfileResponseDto response = mentorService.approveMentor(mentorId, adminId);
        return ResponseEntity.ok(ApiResponse.<MentorProfileResponseDto>builder()
                .success(true)
                .data(response)
                .message("Mentor approved successfully")
                .statusCode(200)
                .build());
    }

    @PutMapping("/{mentorId}/reject")
    public ResponseEntity<ApiResponse<MentorProfileResponseDto>> rejectMentor(
            @PathVariable Long mentorId,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long adminId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String role) {
        log.info("PUT /{}/reject - Admin {}", mentorId, adminId);
        if (role == null || !role.contains("ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can reject mentors");
        }
        MentorProfileResponseDto response = mentorService.rejectMentor(mentorId, adminId);
        return ResponseEntity.ok(ApiResponse.<MentorProfileResponseDto>builder()
                .success(true)
                .data(response)
                .message("Mentor rejected successfully")
                .statusCode(200)
                .build());
    }

    @PutMapping("/availability")
    public ResponseEntity<ApiResponse<MentorProfileResponseDto>> updateAvailability(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
            @Valid @RequestBody UpdateAvailabilityRequestDto request) {

        if (roles == null || !roles.contains("ROLE_MENTOR")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only mentors can update their availability");
        }
        log.info("PUT /availability - User {}", userId);
        MentorProfileResponseDto response = mentorService.updateAvailability(userId, request);
        return ResponseEntity.ok(ApiResponse.<MentorProfileResponseDto>builder()
                .success(true)
                .data(response)
                .message("Availability updated successfully")
                .statusCode(200)
                .build());
    }

    @PutMapping("/{mentorId}/suspend")
    public ResponseEntity<ApiResponse<MentorProfileResponseDto>> suspendMentor(
            @PathVariable Long mentorId,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long adminId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String role) {
        log.info("PUT /{}/suspend - Admin {}", mentorId, adminId);
        if (role == null || !role.contains("ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can suspend mentors");
        }
        MentorProfileResponseDto response = mentorService.suspendMentor(mentorId, adminId);
        return ResponseEntity.ok(ApiResponse.<MentorProfileResponseDto>builder()
                .success(true)
                .data(response)
                .message("Mentor suspended successfully")
                .statusCode(200)
                .build());
    }

    @PutMapping("/{mentorId}/rating")
    public ResponseEntity<ApiResponse<Void>> updateRating(
            @PathVariable Long mentorId,
            @RequestParam Double newRating) {
        log.info("PUT /{}/rating - New rating: {}", mentorId, newRating);
        mentorService.updateMentorRating(mentorId, newRating);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Rating updated successfully")
                .statusCode(200)
                .build());
    }

    /**
     * Internal endpoint for service-to-service communication
     * Used by notification-service to fetch mentor profile details
     * Bypasses gateway authorization checks
     */
    @GetMapping("/internal/{mentorId}")
    @Operation(summary = "Internal endpoint: Get mentor profile", description = "Internal service-to-service endpoint for fetching mentor profile")
    public ResponseEntity<ApiResponse<MentorProfileResponseDto>> getInternalMentorProfile(
            @PathVariable Long mentorId) {
        log.info("Internal: Fetching mentor profile for mentorId: {}", mentorId);
        MentorProfileResponseDto response = mentorService.getMentorProfile(mentorId);
        return ResponseEntity.ok(ApiResponse.<MentorProfileResponseDto>builder()
                .success(true)
                .data(response)
                .message("Mentor profile fetched successfully")
                .statusCode(200)
                .build());
    }
}

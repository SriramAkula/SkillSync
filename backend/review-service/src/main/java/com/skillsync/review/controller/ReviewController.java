package com.skillsync.review.controller;

import com.skillsync.review.dto.ApiResponse;
import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/review")
@Tag(name = "Review Management", description = "Mentor reviews and ratings")
public class ReviewController {
    
    private static final Logger log = LoggerFactory.getLogger(ReviewController.class);
    
    @Autowired
    private ReviewService reviewService;
    
    @PostMapping
    @Operation(summary = "Submit a review", description = "Submit a review for a mentor after a session")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Review submitted successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<ApiResponse<ReviewResponseDto>> submitReview(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long learnerId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
            @Valid @RequestBody SubmitReviewRequestDto request) {
        
        if (roles == null || (!roles.contains("ROLE_LEARNER") && !roles.contains("ROLE_MENTOR"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners or mentors can submit reviews");
        }
        log.info("POST / - Learner {} submitting review", learnerId);
        ReviewResponseDto response = reviewService.submitReview(learnerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.<ReviewResponseDto>builder()
                .success(true)
                .data(response)
                .message("Review submitted successfully")
                .statusCode(201)
                .build());
    }
    
    @GetMapping("/{reviewId}")
    @Operation(summary = "Get review details", description = "Retrieve review details by review ID")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Review retrieved successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Review not found")
    })
    public ResponseEntity<ApiResponse<ReviewResponseDto>> getReview(
            @PathVariable Long reviewId) {
        log.info("GET /{} - Get review details", reviewId);
        ReviewResponseDto response = reviewService.getReview(reviewId);
        return ResponseEntity.ok(ApiResponse.<ReviewResponseDto>builder()
            .success(true)
            .data(response)
            .message("Review retrieved successfully")
            .statusCode(200)
            .build());
    }
    
    @GetMapping("/mentors/{mentorId}")
    @Operation(summary = "Get mentor reviews", description = "Retrieve all reviews for a specific mentor")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Mentor reviews retrieved successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Mentor not found")
    })
    public ResponseEntity<ApiResponse<List<ReviewResponseDto>>> getMentorReviews(
            @PathVariable Long mentorId) {
        log.info("GET /mentors/{} - Get mentor reviews", mentorId);
        List<ReviewResponseDto> response = reviewService.getMentorReviews(mentorId);
        return ResponseEntity.ok(ApiResponse.<List<ReviewResponseDto>>builder()
            .success(true)
            .data(response)
            .message("Mentor reviews retrieved successfully")
            .statusCode(200)
            .build());
    }
    
    @GetMapping("/mentors/{mentorId}/rating")
    @Operation(summary = "Get mentor rating", description = "Retrieve overall rating and review count for a mentor")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Mentor rating retrieved successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Mentor not found")
    })
    public ResponseEntity<ApiResponse<MentorRatingDto>> getMentorRating(
            @PathVariable Long mentorId) {
        log.info("GET /mentors/{}/rating - Get mentor rating", mentorId);
        MentorRatingDto response = reviewService.getMentorRating(mentorId);
        return ResponseEntity.ok(ApiResponse.<MentorRatingDto>builder()
            .success(true)
            .data(response)
            .message("Mentor rating retrieved successfully")
            .statusCode(200)
            .build());
    }
    
    @PutMapping("/{reviewId}")
    @Operation(summary = "Update review", description = "Update an existing review (Author only)")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Review updated successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only review author can update"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Review not found")
    })
    public ResponseEntity<ApiResponse<ReviewResponseDto>> updateReview(
            @PathVariable Long reviewId,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long learnerId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
            @Valid @RequestBody SubmitReviewRequestDto request) {
        
        if (roles == null || (!roles.contains("ROLE_LEARNER") && !roles.contains("ROLE_MENTOR"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners or mentors can update reviews");
        }
        log.info("PUT /{} - Learner {} updating review", reviewId, learnerId);
        ReviewResponseDto response = reviewService.updateReview(reviewId, learnerId, request);
        return ResponseEntity.ok(ApiResponse.<ReviewResponseDto>builder()
            .success(true)
            .data(response)
            .message("Review updated successfully")
            .statusCode(200)
            .build());
    }
    
    @DeleteMapping("/{reviewId}")
    @Operation(summary = "Delete review", description = "Delete a review (Author only)")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Review deleted successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only review author can delete"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Review not found")
    })
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long reviewId,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long learnerId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {
        
        if (roles == null || (!roles.contains("ROLE_LEARNER") && !roles.contains("ROLE_MENTOR"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners or mentors can delete reviews");
        }
        log.info("DELETE /{} - Learner {} deleting review", reviewId, learnerId);
        reviewService.deleteReview(reviewId, learnerId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .success(true)
            .message("Review deleted successfully")
            .statusCode(200)
            .build());
    }
}

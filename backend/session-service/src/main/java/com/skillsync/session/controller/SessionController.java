package com.skillsync.session.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.skillsync.session.dto.ApiResponse;
import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.service.SessionService;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/session")
@Tag(name = "Session Management", description = "Session request and management operations")
public class SessionController {

    private static final Logger log = LoggerFactory.getLogger(SessionController.class);
    
    @Autowired
    private SessionService sessionService;

    @PostMapping("/request")
    @Operation(summary = "Request a session", description = "Submit a new session request to a mentor")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Session requested successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Mentor already has a session at this time")
    })
    public ResponseEntity<ApiResponse<SessionResponseDto>> requestSession(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long learnerId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
            @Valid @RequestBody RequestSessionRequestDto request) {

        if (roles == null || !roles.contains("ROLE_LEARNER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners can request sessions");
        }
        log.info("POST /request - User {}", learnerId);
        SessionResponseDto response = sessionService.requestSession(learnerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<SessionResponseDto>builder()
                        .success(true)
                        .data(response)
                        .message("Session requested successfully")
                        .statusCode(201)
                        .build());
    }

    @GetMapping("/{sessionId}")
    @Operation(summary = "Get session details", description = "Retrieve session details by session ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Session retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<ApiResponse<SessionResponseDto>> getSession(
            @PathVariable Long sessionId) {

        log.info("GET /{} - Get session details", sessionId);
        SessionResponseDto response = sessionService.getSession(sessionId);
        return ResponseEntity.ok(ApiResponse.<SessionResponseDto>builder()
                .success(true)
                .data(response)
                .message("Session retrieved successfully")
                .statusCode(200)
                .build());
    }

    @GetMapping("/mentor/list")
    @Operation(summary = "Get mentor sessions", description = "Retrieve all sessions for the mentor")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Mentor sessions retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ApiResponse<List<SessionResponseDto>>> getMentorSessions(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long mentorId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || !roles.contains("ROLE_MENTOR")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only mentors can view their sessions");
        }
        log.info("GET /mentor/list - Mentor {}", mentorId);
        List<SessionResponseDto> response = sessionService.getSessionsForMentor(mentorId);
        return ResponseEntity.ok(ApiResponse.<List<SessionResponseDto>>builder()
                .success(true)
                .data(response)
                .message("Mentor sessions retrieved successfully")
                .statusCode(200)
                .build());
    }

    @GetMapping("/learner/list")
    @Operation(summary = "Get learner sessions", description = "Retrieve all sessions for the learner")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Learner sessions retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ApiResponse<List<SessionResponseDto>>> getLearnerSessions(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long learnerId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || !roles.contains("ROLE_LEARNER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners can view their session history");
        }
        log.info("GET /learner/list - Learner {}", learnerId);
        List<SessionResponseDto> response = sessionService.getSessionsForLearner(learnerId);
        return ResponseEntity.ok(ApiResponse.<List<SessionResponseDto>>builder()
                .success(true)
                .data(response)
                .message("Learner sessions retrieved successfully")
                .statusCode(200)
                .build());
    }

    @PutMapping("/{sessionId}/accept")
    @Operation(summary = "Accept session request", description = "Mentor accepts a pending session request")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Session accepted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Session not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Session already accepted or rejected")
    })
    public ResponseEntity<ApiResponse<SessionResponseDto>> acceptSession(
            @PathVariable Long sessionId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || !roles.contains("ROLE_MENTOR")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only mentors can accept sessions");
        }
        log.info("PUT /{}/accept - Accept session", sessionId);
        SessionResponseDto response = sessionService.acceptSession(sessionId);
        return ResponseEntity.ok(ApiResponse.<SessionResponseDto>builder()
                .success(true)
                .data(response)
                .message("Session accepted successfully")
                .statusCode(200)
                .build());
    }

    @PutMapping("/{sessionId}/reject")
    @Operation(summary = "Reject session request", description = "Mentor rejects a pending session request")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Session rejected successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Session not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Session already accepted or rejected")
    })
    public ResponseEntity<ApiResponse<SessionResponseDto>> rejectSession(
            @PathVariable Long sessionId,
            @RequestParam String reason,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || !roles.contains("ROLE_MENTOR")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only mentors can reject sessions");
        }
        log.info("PUT /{}/reject - Reject session", sessionId);
        SessionResponseDto response = sessionService.rejectSession(sessionId, reason);
        return ResponseEntity.ok(ApiResponse.<SessionResponseDto>builder()
                .success(true)
                .data(response)
                .message("Session rejected successfully")
                .statusCode(200)
                .build());
    }

    @PutMapping("/{sessionId}/cancel")
    public ResponseEntity<ApiResponse<SessionResponseDto>> cancelSession(
            @PathVariable Long sessionId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || (!roles.contains("ROLE_LEARNER") && !roles.contains("ROLE_MENTOR"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only relevant participants can cancel sessions");
        }
        log.info("PUT /{}/cancel - Cancel session", sessionId);
        SessionResponseDto response = sessionService.cancelSession(sessionId);
        return ResponseEntity.ok(ApiResponse.<SessionResponseDto>builder()
                .success(true)
                .data(response)
                .message("Session cancelled successfully")
                .statusCode(200)
                .build());
    }

    /**
     * Internal endpoint called by payment-gateway saga orchestrator.
     * Updates session status after payment events (CONFIRMED, PAYMENT_FAILED, REFUNDED).
     */
    @PutMapping("/{sessionId}/status")
    @Operation(summary = "Update session status (internal)", description = "Called by payment-gateway to update session status after payment events")
    public ResponseEntity<ApiResponse<Void>> updateSessionStatus(
            @PathVariable Long sessionId,
            @RequestParam String status) {
        log.info("PUT /{}/status - Updating to {}", sessionId, status);
        sessionService.updateStatus(sessionId, status);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Session status updated to " + status)
                .statusCode(200)
                .build());
    }
}

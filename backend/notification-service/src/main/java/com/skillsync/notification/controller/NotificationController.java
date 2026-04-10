package com.skillsync.notification.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.skillsync.notification.dto.ApiResponse;
import com.skillsync.notification.dto.NotificationDto;
import com.skillsync.notification.service.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Notification Controller
 * Handles notification retrieval (read-only operations)
 * Consumption of events happens in RabbitMQ consumers
 */
@RestController
@RequestMapping("/notification")
@Tag(name = "Notification Management", description = "User notifications and preferences")
public class NotificationController {
    
    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Get all notifications for the authenticated user
     * User ID extracted from JWT token (X-User-Id header)
     */
    @GetMapping
    @Operation(summary = "Get all notifications", description = "Retrieve all notifications for the current user")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notifications retrieved successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ApiResponse<com.skillsync.notification.dto.response.PageResponse<NotificationDto>>> getUserNotifications(
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        
        // Check roles first (403 for missing authorization)
        if (roles == null || roles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authenticated access required");
        }
        
        // Then check userId (401 for missing authentication)
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID is required. Please provide valid authorization.");
        }
        log.info("Fetching paginated notifications for user {} - page: {}, size: {}", userId, page, size);
        
        com.skillsync.notification.dto.response.PageResponse<NotificationDto> response = notificationService.getUserNotifications(userId, page, size);
        
        return new ResponseEntity<>(
            ApiResponse.<com.skillsync.notification.dto.response.PageResponse<NotificationDto>>ok(response, "Notifications retrieved successfully"),
            HttpStatus.OK
        );
    }
    
    /**
     * Get unread notifications for the authenticated user
     */
    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications", description = "Retrieve unread notifications for the current user")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Unread notifications retrieved successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ApiResponse<com.skillsync.notification.dto.response.PageResponse<NotificationDto>>> getUnreadNotifications(
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        if (roles == null || roles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authenticated access required");
        }

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID is required. Please provide valid authorization.");
        }
        log.info("Fetching paginated unread notifications for user {} - page: {}, size: {}", userId, page, size);
        
        com.skillsync.notification.dto.response.PageResponse<NotificationDto> response = notificationService.getUserUnreadNotifications(userId, page, size);
        
        return new ResponseEntity<>(
            ApiResponse.<com.skillsync.notification.dto.response.PageResponse<NotificationDto>>ok(response, "Unread notifications retrieved successfully"),
            HttpStatus.OK
        );
    }
    
    /**
     * Get unread notification count for the authenticated user
     */
    @GetMapping("/unread/count")
    @Operation(summary = "Get unread count", description = "Retrieve the count of unread notifications for the current user")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Unread count retrieved successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ApiResponse<Integer>> getUnreadCount(
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || roles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authenticated access required");
        }

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID is required. Please provide valid authorization.");
        }
        log.info("Getting unread count for user {}", userId);
        
        Integer count = notificationService.getUnreadCount(userId);
        
        return new ResponseEntity<>(
            ApiResponse.<Integer>ok(count, "Unread count retrieved successfully"),
            HttpStatus.OK
        );
    }
    
    /**
     * Mark a notification as read
     */
    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark as read", description = "Mark a specific notification as read")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification marked as read"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden access"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Notification not found")
    })
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long notificationId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || roles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authenticated access required");
        }

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID is required. Please provide valid authorization.");
        }
        log.info("Marking notification {} as read for user {}", notificationId, userId);
        
        notificationService.markAsRead(notificationId, userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .success(true)
            .message("Notification marked as read")
            .statusCode(200)
            .build());
    }
    
    /**
     * Delete a notification
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long notificationId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || roles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authenticated access required");
        }

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID is required. Please provide valid authorization.");
        }
        log.info("Deleting notification {} for user {}", notificationId, userId);
        
        notificationService.deleteNotification(notificationId, userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .success(true)
            .message("Notification deleted successfully")
            .statusCode(200)
            .build());
    }
}

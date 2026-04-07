package com.skillsync.group.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.skillsync.group.dto.ApiResponse;
import com.skillsync.group.dto.request.CreateGroupRequestDto;
import com.skillsync.group.dto.response.GroupResponseDto;
import com.skillsync.group.service.GroupService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/group")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Group Management", description = "Learning group creation and membership management")
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    @Operation(summary = "Create a group", description = "Create a new learning group around a skill")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Group created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ApiResponse<GroupResponseDto>> createGroup(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long creatorId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
            @Valid @RequestBody CreateGroupRequestDto request) {

        if (roles == null || (!roles.contains("ROLE_MENTOR") && !roles.contains("ROLE_LEARNER")
                && !roles.contains("ROLE_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only learners, mentors or admins can create learning groups.");
        }
        log.info("POST / - User {} creating group", creatorId);
        GroupResponseDto response = groupService.createGroup(creatorId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<GroupResponseDto>builder()
                        .success(true)
                        .data(response)
                        .message("Group created successfully")
                        .statusCode(201)
                        .build());
    }

    @GetMapping("/{groupId}")
    @Operation(summary = "Get group details", description = "Retrieve group details and member information")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Group details retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Group not found")
    })
    public ResponseEntity<ApiResponse<GroupResponseDto>> getGroupDetails(
            @PathVariable Long groupId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        log.info("GET /{} - Get group details (user={})", groupId, userId);
        GroupResponseDto response = groupService.getGroupDetails(groupId, userId);
        return ResponseEntity.ok(ApiResponse.<GroupResponseDto>builder()
                .success(true)
                .data(response)
                .message("Group details retrieved successfully")
                .statusCode(200)
                .build());
    }

    @GetMapping("/skill/{skillId}")
    @Operation(summary = "Get groups by skill", description = "Retrieve all groups for a specific skill")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Groups retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Skill not found")
    })
    public ResponseEntity<ApiResponse<List<GroupResponseDto>>> getGroupsBySkill(
            @PathVariable Long skillId,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        log.info("GET /skill/{} - Get groups by skill (user={})", skillId, userId);
        List<GroupResponseDto> response = groupService.getGroupsBySkill(skillId, userId);
        return ResponseEntity.ok(ApiResponse.<List<GroupResponseDto>>builder()
                .success(true)
                .data(response)
                .message("Groups retrieved successfully")
                .statusCode(200)
                .build());
    }

    @PostMapping("/{groupId}/join")
    @Operation(summary = "Join a group", description = "Add current user as member to an existing group")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Joined group successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Group is full"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Group not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Already a member of the group")
    })
    public ResponseEntity<ApiResponse<GroupResponseDto>> joinGroup(
            @PathVariable Long groupId,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || roles.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to join a group");
        }
        log.info("POST /{}/join - User {} joining", groupId, userId);
        GroupResponseDto response = groupService.joinGroup(groupId, userId);
        return ResponseEntity.ok(ApiResponse.<GroupResponseDto>builder()
                .success(true)
                .data(response)
                .message("Joined group successfully")
                .statusCode(200)
                .build());
    }

    @DeleteMapping("/{groupId}/leave")
    @Operation(summary = "Leave a group", description = "Remove current user from group membership")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Left group successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Group not found")
    })
    public ResponseEntity<ApiResponse<GroupResponseDto>> leaveGroup(
            @PathVariable Long groupId,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || roles.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to leave a group");
        }
        log.info("DELETE /{}/leave - User {} leaving", groupId, userId);
        GroupResponseDto response = groupService.leaveGroup(groupId, userId);
        return ResponseEntity.ok(ApiResponse.<GroupResponseDto>builder()
                .success(true)
                .data(response)
                .message("Left group successfully")
                .statusCode(200)
                .build());
    }

    @DeleteMapping("/{groupId}")
    @Operation(summary = "Delete group", description = "Delete a group (Creator only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Group deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only group creator can delete"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Group not found")
    })
    public ResponseEntity<ApiResponse<GroupResponseDto>> deleteGroup(
            @PathVariable Long groupId,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long creatorId,
            @Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles) {

        if (roles == null || roles.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
        log.info("DELETE /{} - Creator {} deleting group", groupId, creatorId);
        groupService.deleteGroup(groupId, creatorId);
        return ResponseEntity.ok(ApiResponse.<GroupResponseDto>builder()
                .success(true)
                .message("Group deleted successfully")
                .statusCode(200)
                .build());
    }

    @GetMapping("/random")
    @Operation(summary = "Get random groups", description = "Retrieve a list of random active groups")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Random groups retrieved successfully")
    })
    public ResponseEntity<ApiResponse<List<GroupResponseDto>>> getRandomGroups(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int limit,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        log.info("GET /random?limit={} - Get random groups (user={})", limit, userId);
        List<GroupResponseDto> response = groupService.getRandomGroups(limit, userId);
        return ResponseEntity.ok(ApiResponse.<List<GroupResponseDto>>builder()
                .success(true)
                .data(response)
                .message("Random groups retrieved successfully")
                .statusCode(200)
                .build());
    }
}

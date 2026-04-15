package com.skillsync.messaging.controller;

import com.skillsync.messaging.dto.ApiResponse;
import com.skillsync.messaging.dto.MessageRequestDTO;
import com.skillsync.messaging.dto.MessageResponseDTO;
import com.skillsync.messaging.service.MessageService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.skillsync.messaging.dto.PagedResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@Slf4j
@RestController
@RequestMapping("/messaging")
@Tag(name = "Messages", description = "Endpoints for sending and retrieving messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @Operation(summary = "Send a message", description = "Sends a new message from one user to another.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Message sent successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed — invalid request body"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "503", description = "User service unavailable")
    })
    public ResponseEntity<ApiResponse<MessageResponseDTO>> sendMessage(@Valid @RequestBody MessageRequestDTO requestDTO) {
        log.info("POST /messaging - sendMessage from: {} to: {}", requestDTO.getSenderId(), requestDTO.getReceiverId());
        MessageResponseDTO response = messageService.sendMessage(requestDTO);
        return new ResponseEntity<>(ApiResponse.created(response), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get message by ID", description = "Retrieves a message by its unique ID.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Message fetched successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Message not found")
    })
    public ResponseEntity<ApiResponse<MessageResponseDTO>> getMessageById(@PathVariable Long id) {
        log.info("GET /messaging/{} - getMessageById", id);
        return ResponseEntity.ok(ApiResponse.ok(messageService.getMessageById(id)));
    }

    @GetMapping("/conversation/{user1}/{user2}")
    @Operation(summary = "Get conversation between users", description = "Retrieves paginated messages exchanged between two users.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Conversation fetched successfully")
    })
    public ResponseEntity<ApiResponse<PagedResponse<MessageResponseDTO>>> getConversation(
            @PathVariable Long user1, 
            @PathVariable Long user2,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        log.info("GET /messaging/conversation/{}/{} - getConversation. Page: {}, Size: {}", user1, user2, page, size);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(messageService.getConversation(user1, user2, pageable)));
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Get group conversation", description = "Retrieves paginated messages for a specific group.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Group conversation fetched successfully")
    })
    public ResponseEntity<ApiResponse<PagedResponse<MessageResponseDTO>>> getGroupConversation(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        log.info("GET /messaging/group/{} - getGroupConversation. Page: {}, Size: {}", groupId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(messageService.getGroupConversation(groupId, pageable)));
    }

    @GetMapping("/partners/{userId}")
    @Operation(summary = "Get conversation partners", description = "Retrieves all user IDs that have had conversations with the given user.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Partners fetched successfully")
    })
    public ResponseEntity<ApiResponse<List<Long>>> getConversationPartners(@PathVariable Long userId) {
        log.info("GET /messaging/partners/{} - getConversationPartners", userId);
        return ResponseEntity.ok(ApiResponse.ok(messageService.getConversationPartners(userId)));
    }
}

package com.skillsync.messaging.query;

import com.skillsync.messaging.client.UserServiceClient;
import com.skillsync.messaging.dto.MessageResponseDTO;
import com.skillsync.messaging.dto.UserDTO;
import com.skillsync.messaging.entity.Message;
import com.skillsync.messaging.exception.MessageNotFoundException;
import com.skillsync.messaging.repository.MessageRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import com.skillsync.messaging.dto.PagedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Slf4j
@Service
public class MessageQueryService {

    private final MessageRepository messageRepository;
    private final UserServiceClient userServiceClient;

    public MessageQueryService(MessageRepository messageRepository, UserServiceClient userServiceClient) {
        this.messageRepository = messageRepository;
        this.userServiceClient = userServiceClient;
    }

    /**
     * QUERY: Get a single message by ID.
     * Cache key = messageId.
     */
    @Cacheable(value = "messageById", key = "#id")
    public MessageResponseDTO getMessageById(Long id) {
        log.info("QUERY - getMessageById: id={} (cache miss, hitting DB)", id);
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new MessageNotFoundException(id));
        return mapToResponseDTO(message);
    }

    /**
     * QUERY: Get full conversation between two users.
     * Cache key = sorted user pair + page configs.
     */
    @CircuitBreaker(name = "messagingService", fallbackMethod = "getConversationFallback")
    @Retry(name = "messagingService")
    @Cacheable(value = "conversation",
               key = "(#user1 < #user2 ? #user1 + '_' + #user2 : #user2 + '_' + #user1) + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public PagedResponse<MessageResponseDTO> getConversation(Long user1, Long user2, Pageable pageable) {
        log.info("QUERY - getConversation: user1={}, user2={} (cache miss, hitting DB)", user1, user2);
        Page<Message> page = messageRepository.findConversation(user1, user2, pageable);
        return PagedResponse.of(page.map(this::mapToResponseDTO));
    }

    public PagedResponse<MessageResponseDTO> getConversationFallback(Long user1, Long user2, Pageable pageable, Throwable throwable) {
        log.error("Circuit breaker fallback - getConversation. Reason: {}", throwable.getMessage());
        PagedResponse<MessageResponseDTO> response = new PagedResponse<>();
        response.setContent(Collections.emptyList());
        return response;
    }

    /**
     * QUERY: Get full conversation messages for a group.
     */
    @CircuitBreaker(name = "messagingService", fallbackMethod = "getGroupConversationFallback")
    @Retry(name = "messagingService")
    @Cacheable(value = "groupConversation", key = "#groupId + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public PagedResponse<MessageResponseDTO> getGroupConversation(Long groupId, Pageable pageable) {
        log.info("QUERY - getGroupConversation: groupId={} (cache miss, hitting DB)", groupId);
        Page<Message> page = messageRepository.findByGroupIdOrderByCreatedAtDesc(groupId, pageable);
        return PagedResponse.of(page.map(this::mapToResponseDTO));
    }

    public PagedResponse<MessageResponseDTO> getGroupConversationFallback(Long groupId, Pageable pageable, Throwable throwable) {
        log.error("Circuit breaker fallback - getGroupConversation. Reason: {}", throwable.getMessage());
        PagedResponse<MessageResponseDTO> response = new PagedResponse<>();
        response.setContent(Collections.emptyList());
        return response;
    }

    /**
     * QUERY: Get all conversation partners for a user.
     * Cache key = userId.
     */
    @CircuitBreaker(name = "messagingService", fallbackMethod = "getConversationPartnersFallback")
    @Retry(name = "messagingService")
    @Cacheable(value = "conversationPartners", key = "#userId")
    public List<Long> getConversationPartners(Long userId) {
        log.info("QUERY - getConversationPartners: userId={} (cache miss, hitting DB)", userId);
        return messageRepository.findConversationPartners(userId);
    }

    public List<Long> getConversationPartnersFallback(Long userId, Throwable throwable) {
        log.error("Circuit breaker fallback - getConversationPartners. Reason: {}", throwable.getMessage());
        return Collections.emptyList();
    }

    private MessageResponseDTO mapToResponseDTO(Message message) {
        String username = message.getSenderUsername();
        String profilePic = message.getSenderProfilePicUrl();

        // Fallback for existing messages where details were not persisted
        if (username == null) {
            try {
                com.skillsync.messaging.dto.ApiResponse<UserDTO> response = userServiceClient.getUserById(message.getSenderId());
                if (response != null && response.isSuccess() && response.getData() != null) {
                    UserDTO user = response.getData();
                    username = user.getUsername();
                    profilePic = user.getProfileImageUrl();
                }
            } catch (Exception e) {
                log.warn("Failed to fetch fallback sender details for userId {}: {}", message.getSenderId(), e.getMessage());
            }
        }

        return MessageResponseDTO.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .receiverId(message.getReceiverId())
                .groupId(message.getGroupId())
                .content(message.getContent())
                .senderUsername(username)
                .senderProfilePicUrl(profilePic)
                .createdAt(message.getCreatedAt())
                .build();
    }
}

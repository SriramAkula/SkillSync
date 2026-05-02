package com.skillsync.messaging.command;

import com.skillsync.messaging.client.UserServiceClient;
import com.skillsync.messaging.dto.MessageRequestDTO;
import com.skillsync.messaging.dto.MessageResponseDTO;
import com.skillsync.messaging.dto.UserDTO;
import com.skillsync.messaging.entity.Message;
import com.skillsync.messaging.event.MessageEventPublisher;
import com.skillsync.messaging.exception.InvalidMessageException;
import com.skillsync.messaging.repository.MessageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class MessageCommandService {

    private final MessageRepository messageRepository;
    private final MessageEventPublisher messageEventPublisher;
    private final UserServiceClient userServiceClient;

    public MessageCommandService(MessageRepository messageRepository,
                                  MessageEventPublisher messageEventPublisher,
                                  UserServiceClient userServiceClient) {
        this.messageRepository = messageRepository;
        this.messageEventPublisher = messageEventPublisher;
        this.userServiceClient = userServiceClient;
    }

    /**
     * COMMAND: Send a message.
     * Evicts conversation and partners caches for both users.
     */
    @Caching(evict = {
        @CacheEvict(value = "conversation",         allEntries = true),
        @CacheEvict(value = "groupConversation",    allEntries = true),
        @CacheEvict(value = "conversationPartners", key = "#requestDTO.senderId"),
        @CacheEvict(value = "conversationPartners", key = "#requestDTO.receiverId", condition = "#requestDTO.receiverId != null")
    })
    public MessageResponseDTO sendMessage(MessageRequestDTO requestDTO) {
        log.info("COMMAND - sendMessage: senderId={}, receiverId={}, groupId={}", 
                requestDTO.getSenderId(), requestDTO.getReceiverId(), requestDTO.getGroupId());

        if (requestDTO.getReceiverId() == null && requestDTO.getGroupId() == null) {
            throw new InvalidMessageException("Either Receiver ID or Group ID must be provided");
        }

        if (requestDTO.getReceiverId() != null && requestDTO.getSenderId().equals(requestDTO.getReceiverId())) {
            throw new InvalidMessageException("Sender and receiver cannot be the same user");
        }

        Message message = Message.builder()
                .senderId(requestDTO.getSenderId())
                .receiverId(requestDTO.getReceiverId())
                .groupId(requestDTO.getGroupId())
                .content(requestDTO.getContent())
                .build();

        // Enrich with sender details from User Service
        try {
            UserDTO sender = userServiceClient.getUserById(requestDTO.getSenderId());
            if (sender != null) {
                message.setSenderUsername(sender.getUsername());
                message.setSenderProfilePicUrl(sender.getProfileImageUrl());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch sender details for userId {}: {}", requestDTO.getSenderId(), e.getMessage());
        }

        Message saved = messageRepository.saveAndFlush(message);
        MessageResponseDTO responseDTO = mapToResponseDTO(saved);

        try {
            messageEventPublisher.publishMessageSent(responseDTO);
        } catch (Exception e) {
            log.warn("Failed to publish message event: {}", e.getMessage());
        }

        return responseDTO;
    }

    // Removed User Service fallback - message sending is now independent

    private MessageResponseDTO mapToResponseDTO(Message message) {
        return MessageResponseDTO.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .receiverId(message.getReceiverId())
                .groupId(message.getGroupId())
                .content(message.getContent())
                .senderUsername(message.getSenderUsername())
                .senderProfilePicUrl(message.getSenderProfilePicUrl())
                .createdAt(message.getCreatedAt())
                .build();
    }
}

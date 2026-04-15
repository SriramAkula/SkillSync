package com.skillsync.messaging.command;

import com.skillsync.messaging.client.UserServiceClient;
import com.skillsync.messaging.dto.MessageRequestDTO;
import com.skillsync.messaging.dto.MessageResponseDTO;
import com.skillsync.messaging.dto.UserDTO;
import com.skillsync.messaging.entity.Message;
import com.skillsync.messaging.event.MessageEventPublisher;
import com.skillsync.messaging.exception.InvalidMessageException;
import com.skillsync.messaging.repository.MessageRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class MessageCommandService {

    private final MessageRepository messageRepository;
    private final UserServiceClient userServiceClient;
    private final MessageEventPublisher messageEventPublisher;

    public MessageCommandService(MessageRepository messageRepository,
                                  UserServiceClient userServiceClient,
                                  MessageEventPublisher messageEventPublisher) {
        this.messageRepository = messageRepository;
        this.userServiceClient = userServiceClient;
        this.messageEventPublisher = messageEventPublisher;
    }

    /**
     * COMMAND: Send a message.
     * Evicts conversation and partners caches for both users.
     */
    @CircuitBreaker(name = "messagingService", fallbackMethod = "sendMessageFallback")
    @Retry(name = "messagingService")
    @Caching(evict = {
        @CacheEvict(value = "conversation",         allEntries = true),
        @CacheEvict(value = "conversationPartners", key = "#requestDTO.senderId"),
        @CacheEvict(value = "conversationPartners", key = "#requestDTO.receiverId")
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

        UserDTO sender = userServiceClient.getUserById(requestDTO.getSenderId());
        if (sender == null) {
            throw new InvalidMessageException("Sender with ID " + requestDTO.getSenderId() + " does not exist");
        }

        Message message = new Message();
        message.setSenderId(requestDTO.getSenderId());
        message.setReceiverId(requestDTO.getReceiverId());
        message.setGroupId(requestDTO.getGroupId());
        message.setContent(requestDTO.getContent());

        Message saved = messageRepository.saveAndFlush(message);
        MessageResponseDTO responseDTO = mapToResponseDTO(saved);

        try {
            messageEventPublisher.publishMessageSent(responseDTO);
        } catch (Exception e) {
            log.warn("Failed to publish message event: {}", e.getMessage());
        }

        return responseDTO;
    }

    public MessageResponseDTO sendMessageFallback(MessageRequestDTO requestDTO, Throwable throwable) {
        log.error("CIRCUIT BREAKER FALLBACK - sendMessage. Reason: {}", throwable.getMessage());
        throw new InvalidMessageException("Cannot send message: User Service is unavailable.");
    }

    private MessageResponseDTO mapToResponseDTO(Message message) {
        return MessageResponseDTO.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .receiverId(message.getReceiverId())
                .groupId(message.getGroupId())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}

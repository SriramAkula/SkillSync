package com.skillsync.messaging.service;

import com.skillsync.messaging.command.MessageCommandService;
import com.skillsync.messaging.dto.MessageRequestDTO;
import com.skillsync.messaging.dto.MessageResponseDTO;
import com.skillsync.messaging.query.MessageQueryService;
import org.springframework.stereotype.Service;

import java.util.List;
import com.skillsync.messaging.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

/**
 * Facade that preserves the existing MessageService contract.
 * Delegates writes → MessageCommandService (CQRS Command side)
 * Delegates reads  → MessageQueryService   (CQRS Query side + Redis cache)
 */
@Service
public class MessageService {

    private final MessageCommandService commandService;
    private final MessageQueryService   queryService;

    public MessageService(MessageCommandService commandService, MessageQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    public MessageResponseDTO sendMessage(MessageRequestDTO requestDTO) {
        return commandService.sendMessage(requestDTO);
    }

    public MessageResponseDTO getMessageById(Long id) {
        return queryService.getMessageById(id);
    }

    public PagedResponse<MessageResponseDTO> getConversation(Long user1, Long user2, Pageable pageable) {
        return queryService.getConversation(user1, user2, pageable);
    }

    public PagedResponse<MessageResponseDTO> getGroupConversation(Long groupId, Pageable pageable) {
        return queryService.getGroupConversation(groupId, pageable);
    }

    public List<Long> getConversationPartners(Long userId) {
        return queryService.getConversationPartners(userId);
    }
}

package com.skillsync.messaging.query;

import com.skillsync.messaging.client.UserServiceClient;
import com.skillsync.messaging.dto.ApiResponse;
import com.skillsync.messaging.dto.MessageResponseDTO;
import com.skillsync.messaging.dto.PagedResponse;
import com.skillsync.messaging.dto.UserDTO;
import com.skillsync.messaging.entity.Message;
import com.skillsync.messaging.exception.MessageNotFoundException;
import com.skillsync.messaging.repository.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageQueryServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private MessageQueryService messageQueryService;

    private Message message;

    @BeforeEach
    void setUp() {
        message = Message.builder()
                .id(1L)
                .senderId(100L)
                .receiverId(200L)
                .content("Test message")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("getMessageById - success with fallback username")
    void getMessageById_Success_WithFallback() {
        UserDTO user = new UserDTO();
        user.setUsername("fallback_user");
        when(userServiceClient.getUserById(100L)).thenReturn(ApiResponse.ok(user));
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));

        MessageResponseDTO result = messageQueryService.getMessageById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSenderUsername()).isEqualTo("fallback_user");
    }

    @Test
    @DisplayName("getMessageById - not found throws exception")
    void getMessageById_NotFound_ThrowsException() {
        when(messageRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messageQueryService.getMessageById(99L))
                .isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    @DisplayName("getConversation - success")
    void getConversation_Success() {
        Page<Message> page = new PageImpl<>(List.of(message));
        when(userServiceClient.getUserById(any())).thenReturn(ApiResponse.ok(new UserDTO()));
        when(messageRepository.findConversation(eq(100L), eq(200L), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<MessageResponseDTO> result = messageQueryService.getConversation(100L, 200L, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getSenderId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("getGroupConversation - success")
    void getGroupConversation_Success() {
        Page<Message> page = new PageImpl<>(List.of(message));
        when(userServiceClient.getUserById(any())).thenReturn(ApiResponse.ok(new UserDTO()));
        when(messageRepository.findByGroupIdOrderByCreatedAtDesc(eq(500L), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<MessageResponseDTO> result = messageQueryService.getGroupConversation(500L, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getConversationPartners - success")
    void getConversationPartners_Success() {
        when(messageRepository.findConversationPartners(100L)).thenReturn(List.of(200L, 300L));

        List<Long> result = messageQueryService.getConversationPartners(100L);

        assertThat(result).containsExactly(200L, 300L);
    }

    @Test
    @DisplayName("Fallbacks - return empty collections")
    void fallbacks_ReturnEmpty() {
        Throwable t = new RuntimeException("Error");
        Pageable p = PageRequest.of(0, 10);

        assertThat(messageQueryService.getConversationFallback(1L, 2L, p, t).getContent()).isEmpty();
        assertThat(messageQueryService.getGroupConversationFallback(5L, p, t).getContent()).isEmpty();
        assertThat(messageQueryService.getConversationPartnersFallback(1L, t)).isEmpty();
    }
}

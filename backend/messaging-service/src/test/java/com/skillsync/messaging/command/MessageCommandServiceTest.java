package com.skillsync.messaging.command;

import com.skillsync.messaging.client.UserServiceClient;
import com.skillsync.messaging.dto.MessageRequestDTO;
import com.skillsync.messaging.dto.MessageResponseDTO;
import com.skillsync.messaging.dto.UserDTO;
import com.skillsync.messaging.entity.Message;
import com.skillsync.messaging.event.MessageEventPublisher;
import com.skillsync.messaging.exception.InvalidMessageException;
import com.skillsync.messaging.repository.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageCommandServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private MessageEventPublisher messageEventPublisher;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private MessageCommandService messageCommandService;

    private MessageRequestDTO validRequest;
    private Message message;

    @BeforeEach
    void setUp() {
        validRequest = new MessageRequestDTO();
        validRequest.setSenderId(100L);
        validRequest.setReceiverId(200L);
        validRequest.setContent("Hello");

        message = Message.builder()
                .id(1L)
                .senderId(100L)
                .receiverId(200L)
                .content("Hello")
                .build();
    }

    @Test
    @DisplayName("sendMessage - success path")
    void sendMessage_Success() {
        UserDTO sender = new UserDTO();
        sender.setUsername("testuser");
        sender.setProfileImageUrl("http://image.url");
        when(userServiceClient.getUserById(100L)).thenReturn(sender);
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(message);

        MessageResponseDTO result = messageCommandService.sendMessage(validRequest);

        assertThat(result.getId()).isEqualTo(1L);
        verify(messageEventPublisher).publishMessageSent(any(MessageResponseDTO.class));
    }

    @Test
    @DisplayName("sendMessage - missing both receiver and group throws exception")
    void sendMessage_MissingReceiverAndGroup_ThrowsException() {
        validRequest.setReceiverId(null);
        validRequest.setGroupId(null);

        assertThatThrownBy(() -> messageCommandService.sendMessage(validRequest))
                .isInstanceOf(InvalidMessageException.class)
                .hasMessageContaining("Either Receiver ID or Group ID must be provided");
    }

    @Test
    @DisplayName("sendMessage - with groupId success path")
    void sendMessage_WithGroupId_Success() {
        UserDTO sender = new UserDTO();
        sender.setUsername("testuser");
        when(userServiceClient.getUserById(100L)).thenReturn(sender);
        validRequest.setReceiverId(null);
        validRequest.setGroupId(500L);
        message.setReceiverId(null);
        message.setGroupId(500L);
        
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(message);

        MessageResponseDTO result = messageCommandService.sendMessage(validRequest);

        assertThat(result.getGroupId()).isEqualTo(500L);
        assertThat(result.getReceiverId()).isNull();
    }

    @Test
    @DisplayName("sendMessage - sender same as receiver throws exception")
    void sendMessage_SenderSameAsReceiver_ThrowsException() {
        validRequest.setReceiverId(100L);
        validRequest.setSenderId(100L);

        assertThatThrownBy(() -> messageCommandService.sendMessage(validRequest))
                .isInstanceOf(InvalidMessageException.class)
                .hasMessageContaining("Sender and receiver cannot be the same user");
    }

    @Test
    @DisplayName("sendMessage - event publishing failure is caught")
    void sendMessage_EventPublishingFails_StillReturnsResponse() {
        when(userServiceClient.getUserById(100L)).thenReturn(new UserDTO());
        when(messageRepository.saveAndFlush(any(Message.class))).thenReturn(message);
        doThrow(new RuntimeException("MQ down")).when(messageEventPublisher).publishMessageSent(any());

        MessageResponseDTO result = messageCommandService.sendMessage(validRequest);

        assertThat(result.getId()).isEqualTo(1L);
        verify(messageEventPublisher).publishMessageSent(any());
    }
}

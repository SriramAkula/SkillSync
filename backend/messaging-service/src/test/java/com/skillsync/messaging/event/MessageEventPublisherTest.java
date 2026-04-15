package com.skillsync.messaging.event;

import com.skillsync.messaging.dto.MessageResponseDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class MessageEventPublisherTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private MessageEventPublisher messageEventPublisher;

    @Test
    @DisplayName("publishMessageSent - publishes expected DTO payload")
    void publishMessageSent_PublishesDTO() {
        ReflectionTestUtils.setField(messageEventPublisher, "exchange", "test.exchange");
        ReflectionTestUtils.setField(messageEventPublisher, "routingKey", "test.routing.key");

        MessageResponseDTO response = MessageResponseDTO.builder()
                .id(1L)
                .senderId(100L)
                .receiverId(200L)
                .content("Test content")
                .build();

        messageEventPublisher.publishMessageSent(response);

        ArgumentCaptor<MessageResponseDTO> eventCaptor = ArgumentCaptor.forClass(MessageResponseDTO.class);

        verify(rabbitTemplate).convertAndSend(eq("test.exchange"), eq("test.routing.key"), eventCaptor.capture());

        MessageResponseDTO event = eventCaptor.getValue();
        assertThat(event.getId()).isEqualTo(1L);
        assertThat(event.getSenderId()).isEqualTo(100L);
        assertThat(event.getReceiverId()).isEqualTo(200L);
        assertThat(event.getContent()).isEqualTo("Test content");
    }
}

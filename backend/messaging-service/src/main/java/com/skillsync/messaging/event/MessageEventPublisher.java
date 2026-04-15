package com.skillsync.messaging.event;

import com.skillsync.messaging.dto.MessageResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class MessageEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange}")
    private String exchange;

    @Value("${rabbitmq.routing-key}")
    private String routingKey;

    public MessageEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishMessageSent(MessageResponseDTO response) {
        rabbitTemplate.convertAndSend(exchange, routingKey, response);
        log.info("Published MESSAGE_SENT event: id={}, sender={}", response.getId(), response.getSenderId());
    }
}

package com.skillsync.session.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ Configuration for Session Service
 * Configures the message converter and RabbitTemplate for event publishing
 */
@Configuration
public class RabbitMQConfig {
    
    // Topic exchange for session events
    @Bean
    public TopicExchange sessionExchange() {
        return new TopicExchange("session-events", true, false);
    }
    
    /**
     * Jackson2JsonMessageConverter for serializing event objects to JSON
     * Allows loose coupling between services (no type ID header required)
     */
    @Bean
    public MessageConverter messageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        // Don't include type ID header to allow loose coupling between services
        converter.setCreateMessageIds(false);
        return converter;
    }
    
    /**
     * RabbitTemplate configured with Jackson2JsonMessageConverter
     * Required to properly serialize event objects when publishing
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter());
        return rabbitTemplate;
    }
}

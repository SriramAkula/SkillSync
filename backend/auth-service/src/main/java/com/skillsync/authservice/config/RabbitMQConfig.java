package com.skillsync.authservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ Configuration for Auth Service
 * Publishes user lifecycle events (created, updated) for synchronization with other services
 */
@Configuration
public class RabbitMQConfig {

    // EXCHANGES
    public static final String AUTH_EXCHANGE = "auth.exchange";

    //QUEUES
    public static final String USER_CREATED_QUEUE = "user.created.queue";
    public static final String USER_UPDATED_QUEUE = "user.updated.queue";

    //ROUTING KEYS=====
    public static final String USER_CREATED_ROUTING_KEY = "user.created";
    public static final String USER_UPDATED_ROUTING_KEY = "user.updated";

    // ===== TOPIC EXCHANGE======
    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(AUTH_EXCHANGE, true, false);
    }

    // ====QUEUES ======
    @Bean
    public Queue userCreatedQueue() {
        return new Queue(USER_CREATED_QUEUE, true);
    }

    @Bean
    public Queue userUpdatedQueue() {
        return new Queue(USER_UPDATED_QUEUE, true);
    }

    // BINDINGS
    @Bean
    public Binding userCreatedBinding(Queue userCreatedQueue, TopicExchange authExchange) {
        return BindingBuilder.bind(userCreatedQueue)
                .to(authExchange)
                .with(USER_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding userUpdatedBinding(Queue userUpdatedQueue, TopicExchange authExchange) {
        return BindingBuilder.bind(userUpdatedQueue)
                .to(authExchange)
                .with(USER_UPDATED_ROUTING_KEY);
    }

    // =====MESSAGE CONVERTER & TEMPLATE ====
    @Bean
    public MessageConverter messageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        // Don't include type ID header to allow loose coupling between services
        // Each service deserializes to its own event class based on fields
        converter.setCreateMessageIds(false);
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter());
        return rabbitTemplate;
    }
}

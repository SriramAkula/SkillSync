package com.skillsync.notification.config;

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
 * RabbitMQ Configuration
 * Declares queues, exchanges, and bindings for notification consumers
 */
@Configuration
public class RabbitMQConfig {
    
    // Exchanges
    @Bean
    public TopicExchange sessionExchange() {
        return new TopicExchange("session-events", true, false);
    }
    
    @Bean
    public TopicExchange mentorExchange() {
        return new TopicExchange("mentor.exchange", true, false);
    }
    
    @Bean
    public TopicExchange reviewExchange() {
        return new TopicExchange("review.exchange", true, false);
    }
    
    // Queues
    @Bean
    public Queue sessionRequestedQueue() {
        return new Queue("session.requested.queue", true);
    }
    
    @Bean
    public Queue sessionAcceptedQueue() {
        return new Queue("session.accepted.queue", true);
    }
    
    @Bean
    public Queue sessionRejectedQueue() {
        return new Queue("session.rejected.queue", true);
    }
    
    @Bean
    public Queue sessionCancelledQueue() {
        return new Queue("session.cancelled.queue", true);
    }
    
    @Bean
    public Queue mentorApprovedQueue() {
        return new Queue("mentor.approved.queue", true);
    }
    
    @Bean
    public Queue reviewSubmittedQueue() {
        return new Queue("review.submitted.queue", true);
    }
    
    // Bindings
    @Bean
    public Binding sessionRequestedBinding(Queue sessionRequestedQueue, TopicExchange sessionExchange) {
        return BindingBuilder.bind(sessionRequestedQueue)
            .to(sessionExchange)
            .with("session.requested");
    }
    
    @Bean
    public Binding sessionAcceptedBinding(Queue sessionAcceptedQueue, TopicExchange sessionExchange) {
        return BindingBuilder.bind(sessionAcceptedQueue)
            .to(sessionExchange)
            .with("session.accepted");
    }
    
    @Bean
    public Binding sessionRejectedBinding(Queue sessionRejectedQueue, TopicExchange sessionExchange) {
        return BindingBuilder.bind(sessionRejectedQueue)
            .to(sessionExchange)
            .with("session.rejected");
    }
    
    @Bean
    public Binding sessionCancelledBinding(Queue sessionCancelledQueue, TopicExchange sessionExchange) {
        return BindingBuilder.bind(sessionCancelledQueue)
            .to(sessionExchange)
            .with("session.cancelled");
    }
    
    @Bean
    public Binding mentorApprovedBinding(Queue mentorApprovedQueue, TopicExchange mentorExchange) {
        return BindingBuilder.bind(mentorApprovedQueue)
            .to(mentorExchange)
            .with("mentor.approved");
    }
    
    @Bean
    public Binding reviewSubmittedBinding(Queue reviewSubmittedQueue, TopicExchange reviewExchange) {
        return BindingBuilder.bind(reviewSubmittedQueue)
            .to(reviewExchange)
            .with("review.submitted");
    }

    // ====== MESSAGE CONVERTER & TEMPLATE ======
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

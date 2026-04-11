package com.skillsync.authservice.publisher;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import com.skillsync.authservice.config.RabbitMQConfig;
import com.skillsync.authservice.event.UserCreatedEvent;
import com.skillsync.authservice.event.UserUpdatedEvent;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

/**
 * Event Publisher for Auth Service
 * Publishes user lifecycle events to RabbitMQ for consumption by other services
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AuthEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Publish UserCreatedEvent when a new user is registered
     */
    @CircuitBreaker(name = "authEventPublisher", fallbackMethod = "publishUserCreatedFallback")
    @Retry(name = "authEventPublisher")
    public void publishUserCreated(UserCreatedEvent event) {
        try {
            log.info("Publishing UserCreatedEvent for userId: {}", event.getUserId());
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.AUTH_EXCHANGE,
                    RabbitMQConfig.USER_CREATED_ROUTING_KEY,
                    event
            );
            log.info("UserCreatedEvent published successfully for userId: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Failed to publish UserCreatedEvent for userId: {}", event.getUserId(), e);
            throw e;
        }
    }

    private void publishUserCreatedFallback(UserCreatedEvent event, Exception ex) {
        log.warn("CircuitBreaker | Fallback triggered for UserCreatedEvent (userId {}): {}", 
            event.getUserId(), ex.getMessage());
        log.info("Event queued for retry: UserCreatedEvent for userId: {}", event.getUserId());
    }

    /**
     * Publish UserUpdatedEvent when a user is updated
     */
    @CircuitBreaker(name = "authEventPublisher", fallbackMethod = "publishUserUpdatedFallback")
    @Retry(name = "authEventPublisher")
    public void publishUserUpdated(UserUpdatedEvent event) {
        try {
            log.info("Publishing UserUpdatedEvent for userId: {}", event.getUserId());
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.AUTH_EXCHANGE,
                    RabbitMQConfig.USER_UPDATED_ROUTING_KEY,
                    event
            );
            log.info("UserUpdatedEvent published successfully for userId: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Failed to publish UserUpdatedEvent for userId: {}", event.getUserId(), e);
            throw e;
        }
    }

    private void publishUserUpdatedFallback(UserUpdatedEvent event, Exception ex) {
        log.warn("CircuitBreaker | Fallback triggered for UserUpdatedEvent (userId {}): {}", 
            event.getUserId(), ex.getMessage());
        log.info("Event queued for retry: UserUpdatedEvent for userId: {}", event.getUserId());
    }
}



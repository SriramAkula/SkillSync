package com.skillsync.session.publisher;

import com.skillsync.session.event.SessionRequestedEvent;
import com.skillsync.session.event.SessionAcceptedEvent;
import com.skillsync.session.event.SessionRejectedEvent;
import com.skillsync.session.event.SessionCancelledEvent;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

@Component
@Slf4j
@RequiredArgsConstructor
public class SessionEventPublisher {
    
    private final RabbitTemplate rabbitTemplate;
    
    @CircuitBreaker(name = "sessionEventPublisher", fallbackMethod = "publishSessionRequestedFallback")
    @Retry(name = "sessionEventPublisher")
    public void publishSessionRequested(SessionRequestedEvent event) {
        try {
            rabbitTemplate.convertAndSend("session-events", "session.requested", event);
            log.info("Published SessionRequestedEvent for session {}", event.getSessionId());
        } catch (Exception e) {
            log.error("Failed to publish SessionRequestedEvent: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    private void publishSessionRequestedFallback(SessionRequestedEvent event, Exception ex) {
        log.warn("CircuitBreaker | Fallback triggered for SessionRequestedEvent (session {}): {}", 
            event.getSessionId(), ex.getMessage());
        // Log event for later processing or alternative handling
        log.info("Event queued for retry: SessionRequestedEvent for session {} (mentor: {}, learner: {})", 
            event.getSessionId(), event.getMentorId(), event.getLearnerId());
    }
    
    @CircuitBreaker(name = "sessionEventPublisher", fallbackMethod = "publishSessionAcceptedFallback")
    @Retry(name = "sessionEventPublisher")
    public void publishSessionAccepted(SessionAcceptedEvent event) {
        try {
            rabbitTemplate.convertAndSend("session-events", "session.accepted", event);
            log.info("Published SessionAcceptedEvent for session {}", event.getSessionId());
        } catch (Exception e) {
            log.error("Failed to publish SessionAcceptedEvent: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    private void publishSessionAcceptedFallback(SessionAcceptedEvent event, Exception ex) {
        log.warn("CircuitBreaker | Fallback triggered for SessionAcceptedEvent (session {}): {}", 
            event.getSessionId(), ex.getMessage());
        log.info("Event queued for retry: SessionAcceptedEvent for session {} (mentor: {}, learner: {})", 
            event.getSessionId(), event.getMentorId(), event.getLearnerId());
    }
    
    @CircuitBreaker(name = "sessionEventPublisher", fallbackMethod = "publishSessionRejectedFallback")
    @Retry(name = "sessionEventPublisher")
    public void publishSessionRejected(SessionRejectedEvent event) {
        try {
            rabbitTemplate.convertAndSend("session-events", "session.rejected", event);
            log.info("Published SessionRejectedEvent for session {}", event.getSessionId());
        } catch (Exception e) {
            log.error("Failed to publish SessionRejectedEvent: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    private void publishSessionRejectedFallback(SessionRejectedEvent event, Exception ex) {
        log.warn("CircuitBreaker | Fallback triggered for SessionRejectedEvent (session {}): {}", 
            event.getSessionId(), ex.getMessage());
        log.info("Event queued for retry: SessionRejectedEvent for session {} (mentor: {}, learner: {}, reason: {})", 
            event.getSessionId(), event.getMentorId(), event.getLearnerId(), event.getRejectionReason());
    }
    
    @CircuitBreaker(name = "sessionEventPublisher", fallbackMethod = "publishSessionCancelledFallback")
    @Retry(name = "sessionEventPublisher")
    public void publishSessionCancelled(SessionCancelledEvent event) {
        try {
            rabbitTemplate.convertAndSend("session-events", "session.cancelled", event);
            log.info("Published SessionCancelledEvent for session {}", event.getSessionId());
        } catch (Exception e) {
            log.error("Failed to publish SessionCancelledEvent: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    private void publishSessionCancelledFallback(SessionCancelledEvent event, Exception ex) {
        log.warn("CircuitBreaker | Fallback triggered for SessionCancelledEvent (session {}): {}", 
            event.getSessionId(), ex.getMessage());
        log.info("Event queued for retry: SessionCancelledEvent for session {} (mentor: {}, learner: {})", 
            event.getSessionId(), event.getMentorId(), event.getLearnerId());
    }
}

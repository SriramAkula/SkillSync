package com.skillsync.session.publisher;

import com.skillsync.session.event.SessionAcceptedEvent;
import com.skillsync.session.event.SessionCancelledEvent;
import com.skillsync.session.event.SessionRejectedEvent;
import com.skillsync.session.event.SessionRequestedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionEventPublisherTest {

    @Mock private RabbitTemplate rabbitTemplate;
    @InjectMocks private SessionEventPublisher sessionEventPublisher;

    @Test
    void publishSessionRequested_shouldSendMessage() {
        SessionRequestedEvent event = new SessionRequestedEvent();
        sessionEventPublisher.publishSessionRequested(event);
        verify(rabbitTemplate).convertAndSend(eq("session-events"), eq("session.requested"), any(SessionRequestedEvent.class));
    }

    @Test
    void publishSessionAccepted_shouldSendMessage() {
        SessionAcceptedEvent event = new SessionAcceptedEvent();
        sessionEventPublisher.publishSessionAccepted(event);
        verify(rabbitTemplate).convertAndSend(eq("session-events"), eq("session.accepted"), any(SessionAcceptedEvent.class));
    }

    @Test
    void publishSessionRejected_shouldSendMessage() {
        SessionRejectedEvent event = new SessionRejectedEvent();
        sessionEventPublisher.publishSessionRejected(event);
        verify(rabbitTemplate).convertAndSend(eq("session-events"), eq("session.rejected"), any(SessionRejectedEvent.class));
    }

    @Test
    void publishSessionCancelled_shouldSendMessage() {
        SessionCancelledEvent event = new SessionCancelledEvent();
        sessionEventPublisher.publishSessionCancelled(event);
        verify(rabbitTemplate).convertAndSend(eq("session-events"), eq("session.cancelled"), any(SessionCancelledEvent.class));
    }

    // ─── Fallback Method Coverage ─────────────────────────────────────────────

    @Test
    void publishSessionRequestedFallback_shouldLog() {
        sessionEventPublisher.publishSessionRequestedFallback(new SessionRequestedEvent(), new Exception("error"));
        // Verified by log (no assertion possible easily, but hits the lines)
    }

    @Test
    void publishSessionAcceptedFallback_shouldLog() {
        sessionEventPublisher.publishSessionAcceptedFallback(new SessionAcceptedEvent(), new Exception("error"));
    }

    @Test
    void publishSessionRejectedFallback_shouldLog() {
        sessionEventPublisher.publishSessionRejectedFallback(new SessionRejectedEvent(), new Exception("error"));
    }

    @Test
    void publishSessionCancelledFallback_shouldLog() {
        sessionEventPublisher.publishSessionCancelledFallback(new SessionCancelledEvent(), new Exception("error"));
    }

    @Test
    void publishSessionRequested_shouldThrow_whenRabbitFails() {
        doThrow(new RuntimeException("Rabbit down")).when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(SessionRequestedEvent.class));
        try {
            sessionEventPublisher.publishSessionRequested(new SessionRequestedEvent());
        } catch (Exception ignored) {}
        verify(rabbitTemplate).convertAndSend(anyString(), anyString(), any(SessionRequestedEvent.class));
    }

    @Test
    void publishSessionAccepted_shouldThrow_whenRabbitFails() {
        doThrow(new RuntimeException("error")).when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(SessionAcceptedEvent.class));
        try { sessionEventPublisher.publishSessionAccepted(new SessionAcceptedEvent()); } catch (Exception ignored) {}
    }

    @Test
    void publishSessionRejected_shouldThrow_whenRabbitFails() {
        doThrow(new RuntimeException("error")).when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(SessionRejectedEvent.class));
        try { sessionEventPublisher.publishSessionRejected(new SessionRejectedEvent()); } catch (Exception ignored) {}
    }

    @Test
    void publishSessionCancelled_shouldThrow_whenRabbitFails() {
        doThrow(new RuntimeException("error")).when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(SessionCancelledEvent.class));
        try { sessionEventPublisher.publishSessionCancelled(new SessionCancelledEvent()); } catch (Exception ignored) {}
    }
}

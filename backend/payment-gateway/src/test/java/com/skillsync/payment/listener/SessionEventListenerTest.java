package com.skillsync.payment.listener;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.skillsync.payment.saga.SagaOrchestrator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

@ExtendWith(MockitoExtension.class)
class SessionEventListenerTest {

    @Mock private SagaOrchestrator sagaOrchestrator;
    @InjectMocks private SessionEventListener sessionEventListener;

    @Test
    void onSessionAccepted_shouldTriggerOrchestrator() {
        Map<String, Object> message = Map.of(
                "sessionId", 100,
                "mentorId", 10,
                "learnerId", 50
        );

        sessionEventListener.onSessionAccepted(message);

        verify(sagaOrchestrator).onSessionAccepted(100L, 10L, 50L);
    }

    @Test
    void onSessionCancelled_shouldTriggerRefund() {
        Map<String, Object> message = Map.of("sessionId", 100);
        sessionEventListener.onSessionCancelled(message);
        verify(sagaOrchestrator).initiateRefund(100L);
    }

    @Test
    void onSessionAccepted_shouldHandleMissingFields() {
        assertThrows(RuntimeException.class, () -> sessionEventListener.onSessionAccepted(Map.of()));
    }

    @Test
    void onSessionCancelled_shouldHandleException() {
        Map<String, Object> message = Map.of("sessionId", "invalid");
        assertThrows(RuntimeException.class, () -> sessionEventListener.onSessionCancelled(message));
    }

    @Test
    void toLong_shouldHandleVariousTypes() {
        Map<String, Object> message = Map.of(
            "sessionId", 100L,
            "mentorId", 10,
            "learnerId", 50
        );
        sessionEventListener.onSessionAccepted(message);
        verify(sagaOrchestrator).onSessionAccepted(100L, 10L, 50L);
        
        Map<String, Object> message2 = Map.of(
            "sessionId", "200",
            "mentorId", 20,
            "learnerId", 60
        );
        sessionEventListener.onSessionAccepted(message2);
        verify(sagaOrchestrator).onSessionAccepted(200L, 20L, 60L);
    }
}

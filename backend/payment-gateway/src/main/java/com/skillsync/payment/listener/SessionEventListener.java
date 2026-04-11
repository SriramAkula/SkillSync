package com.skillsync.payment.listener;

import com.skillsync.payment.config.RabbitMQConfig;
import com.skillsync.payment.saga.SagaOrchestrator;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import java.util.Map;

/**
 * Listens to session events from session-service via RabbitMQ.
 * This is the async trigger for the saga state machine.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class SessionEventListener {

    private final SagaOrchestrator sagaOrchestrator;

    /**
     * Triggered when mentor accepts a session.
     * Advances saga from INITIATED -> PAYMENT_PENDING -> PAYMENT_PROCESSING -> COMPLETED/FAILED
     */
    @RabbitListener(queues = RabbitMQConfig.PAYMENT_SESSION_ACCEPTED_QUEUE)
    public void onSessionAccepted(Map<String, Object> payload) {
        try {
            Long sessionId = toLong(payload.get("sessionId"));
            Long mentorId  = toLong(payload.get("mentorId"));
            Long learnerId = toLong(payload.get("learnerId"));

            log.info("[LISTENER] session.accepted received - sessionId={}, mentorId={}, learnerId={}",
                    sessionId, mentorId, learnerId);

            sagaOrchestrator.onSessionAccepted(sessionId, mentorId, learnerId);

        } catch (Exception e) {
            log.error("[LISTENER] Failed to process session.accepted event: {}", e.getMessage(), e);
            // Re-throw so RabbitMQ routes to DLQ after max retries
            throw new RuntimeException("session.accepted processing failed", e);
        }
    }

    /**
     * Triggered when a session is cancelled.
     * Initiates compensation (refund) if payment was already made.
     */
    @RabbitListener(queues = RabbitMQConfig.PAYMENT_SESSION_CANCELLED_QUEUE)
    public void onSessionCancelled(Map<String, Object> payload) {
        try {
            Long sessionId = toLong(payload.get("sessionId"));

            log.info("[LISTENER] session.cancelled received - sessionId={}", sessionId);

            sagaOrchestrator.initiateRefund(sessionId);

        } catch (Exception e) {
            log.error("[LISTENER] Failed to process session.cancelled event: {}", e.getMessage(), e);
            throw new RuntimeException("session.cancelled processing failed", e);
        }
    }

    private Long toLong(Object value) {
        if (value == null) throw new IllegalArgumentException("Missing required field in event payload");
        if (value instanceof Integer) return ((Integer) value).longValue();
        if (value instanceof Long) return (Long) value;
        return Long.parseLong(value.toString());
    }
}

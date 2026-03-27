package com.skillsync.payment.saga;

import com.skillsync.payment.client.MentorServiceClient;
import com.skillsync.payment.client.SessionServiceClient;
import com.skillsync.payment.client.dto.MentorRateDto;
import com.skillsync.payment.dto.request.StartSagaRequest;
import com.skillsync.payment.dto.request.VerifyPaymentRequest;
import com.skillsync.payment.dto.response.SagaResponse;
import com.skillsync.payment.entity.PaymentSaga;
import com.skillsync.payment.enums.SagaStatus;
import com.skillsync.payment.exception.DuplicateSagaException;
import com.skillsync.payment.exception.SagaNotFoundException;
import com.skillsync.payment.repository.PaymentSagaRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class SagaOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(SagaOrchestrator.class);

    private final PaymentSagaRepository sagaRepository;
    private final MentorServiceClient mentorServiceClient;
    private final SessionServiceClient sessionServiceClient;
    private final PaymentProcessor paymentProcessor;

    public SagaOrchestrator(PaymentSagaRepository sagaRepository,
                             MentorServiceClient mentorServiceClient,
                             SessionServiceClient sessionServiceClient,
                             PaymentProcessor paymentProcessor) {
        this.sagaRepository = sagaRepository;
        this.mentorServiceClient = mentorServiceClient;
        this.sessionServiceClient = sessionServiceClient;
        this.paymentProcessor = paymentProcessor;
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Start Saga — called when session is created
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public SagaResponse startSaga(StartSagaRequest request) {
        // Idempotency — prevent duplicate sagas for same session
        if (sagaRepository.existsBySessionIdAndStatusIn(request.getSessionId(),
                List.of(SagaStatus.INITIATED, SagaStatus.PAYMENT_PENDING,
                        SagaStatus.PAYMENT_PROCESSING, SagaStatus.COMPLETED))) {
            throw new DuplicateSagaException("Saga already exists for sessionId=" + request.getSessionId());
        }

        PaymentSaga saga = new PaymentSaga();
        saga.setSessionId(request.getSessionId());
        saga.setLearnerId(request.getLearnerId());
        saga.setMentorId(request.getMentorId());
        saga.setDurationMinutes(request.getDurationMinutes());
        saga.setCorrelationId(UUID.randomUUID().toString());
        saga.setStatus(SagaStatus.INITIATED);
        saga = sagaRepository.save(saga);

        log.info("[SAGA][{}] Started — sessionId={}, mentorId={}, learnerId={}",
                saga.getCorrelationId(), saga.getSessionId(), saga.getMentorId(), saga.getLearnerId());
        return toResponse(saga);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Mentor Accepted — create Razorpay order, return to frontend
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public SagaResponse onSessionAccepted(Long sessionId, Long mentorId, Long learnerId) {
        PaymentSaga saga = sagaRepository.findBySessionId(sessionId)
                .orElseGet(() -> {
                    log.warn("[SAGA] No saga found for sessionId={}, auto-creating", sessionId);
                    PaymentSaga s = new PaymentSaga();
                    s.setSessionId(sessionId);
                    s.setMentorId(mentorId);
                    s.setLearnerId(learnerId);
                    s.setCorrelationId(UUID.randomUUID().toString());
                    s.setStatus(SagaStatus.INITIATED);
                    return sagaRepository.save(s);
                });

        if (saga.getStatus() != SagaStatus.INITIATED) {
            log.warn("[SAGA][{}] Ignoring session.accepted — current status={}",
                    saga.getCorrelationId(), saga.getStatus());
            return toResponse(saga);
        }

        try {
            // Fetch mentor hourly rate
            BigDecimal hourlyRate = fetchMentorRate(saga.getMentorId());
            saga.setHourlyRate(hourlyRate);

            // Calculate amount
            BigDecimal durationHours = BigDecimal.valueOf(saga.getDurationMinutes())
                    .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
            BigDecimal amount = hourlyRate.multiply(durationHours).setScale(2, RoundingMode.HALF_UP);
            saga.setAmount(amount);

            // Create Razorpay order — returns order_id for frontend checkout
            String razorpayOrderId = paymentProcessor.createOrder(saga.getCorrelationId(), amount);
            saga.setPaymentReference(razorpayOrderId); // store order_id temporarily
            saga.setStatus(SagaStatus.PAYMENT_PENDING);
            sagaRepository.save(saga);

            log.info("[SAGA][{}] Razorpay order created. orderId={}, amount={}",
                    saga.getCorrelationId(), razorpayOrderId, amount);

        } catch (Exception e) {
            log.error("[SAGA][{}] Failed to create Razorpay order: {}", saga.getCorrelationId(), e.getMessage());
            saga.setStatus(SagaStatus.FAILED);
            saga.setFailureReason(e.getMessage());
            sagaRepository.save(saga);
        }

        return toResponse(saga);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Verify Payment — called by frontend after Razorpay Checkout
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public SagaResponse verifyAndCompletePayment(VerifyPaymentRequest request) {
        PaymentSaga saga = sagaRepository.findBySessionId(request.getSessionId())
                .orElseThrow(() -> new SagaNotFoundException("No saga for sessionId=" + request.getSessionId()));

        if (saga.getStatus() != SagaStatus.PAYMENT_PENDING) {
            log.warn("[SAGA][{}] Verify called but status={}",
                    saga.getCorrelationId(), saga.getStatus());
            return toResponse(saga);
        }

        saga.setStatus(SagaStatus.PAYMENT_PROCESSING);
        sagaRepository.save(saga);

        try {
            // 1. Verify Razorpay signature — prevents tampered requests
            paymentProcessor.verifySignature(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature()
            );

            // 2. Confirm payment is captured on Razorpay
            String confirmedPaymentId = paymentProcessor.fetchAndConfirmPayment(request.getRazorpayPaymentId());

            // 3. Store final payment_id (replaces order_id)
            saga.setPaymentReference(confirmedPaymentId);
            saga.setStatus(SagaStatus.COMPLETED);
            sagaRepository.save(saga);

            // 4. Update session to CONFIRMED
            updateSessionStatus(saga.getSessionId(), "CONFIRMED");

            log.info("[SAGA][{}] Payment COMPLETED. paymentId={}, sessionId={}",
                    saga.getCorrelationId(), confirmedPaymentId, saga.getSessionId());

        } catch (Exception e) {
            log.error("[SAGA][{}] Payment verification FAILED: {}", saga.getCorrelationId(), e.getMessage());
            saga.setStatus(SagaStatus.FAILED);
            saga.setFailureReason(e.getMessage());
            sagaRepository.save(saga);

            // Compensation — mark session as PAYMENT_FAILED
            try {
                updateSessionStatus(saga.getSessionId(), "PAYMENT_FAILED");
            } catch (Exception ex) {
                log.error("[SAGA][{}] Failed to update session after payment failure: {}",
                        saga.getCorrelationId(), ex.getMessage());
            }
        }

        return toResponse(saga);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Compensation — Refund via Razorpay on cancellation
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public SagaResponse initiateRefund(Long sessionId) {
        PaymentSaga saga = sagaRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new SagaNotFoundException("No saga for sessionId=" + sessionId));

        // Only refund if payment was completed
        if (saga.getStatus() != SagaStatus.COMPLETED) {
            log.warn("[SAGA][{}] Refund skipped — status={} (no payment made)",
                    saga.getCorrelationId(), saga.getStatus());
            return toResponse(saga);
        }

        // Idempotency — don't refund twice
        if (saga.getStatus() == SagaStatus.REFUNDED || saga.getStatus() == SagaStatus.REFUND_INITIATED) {
            log.warn("[SAGA][{}] Refund already processed", saga.getCorrelationId());
            return toResponse(saga);
        }

        saga.setStatus(SagaStatus.REFUND_INITIATED);
        sagaRepository.save(saga);

        try {
            // Call Razorpay refund API
            String refundId = paymentProcessor.refund(saga.getPaymentReference(), saga.getAmount());
            saga.setRefundReference(refundId);
            saga.setStatus(SagaStatus.REFUNDED);
            sagaRepository.save(saga);

            updateSessionStatus(sessionId, "REFUNDED");

            log.info("[SAGA][{}] Refund COMPLETED. refundId={}", saga.getCorrelationId(), refundId);

        } catch (Exception e) {
            log.error("[SAGA][{}] Refund FAILED: {}", saga.getCorrelationId(), e.getMessage());
            saga.setStatus(SagaStatus.COMPENSATION_FAILED);
            saga.setFailureReason("Refund failed: " + e.getMessage());
            sagaRepository.save(saga);
        }

        return toResponse(saga);
    }

    // ─────────────────────────────────────────────────────────────
    // Mentor Rejected — end saga, no payment
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public void onSessionRejected(Long sessionId) {
        sagaRepository.findBySessionId(sessionId).ifPresent(saga -> {
            if (saga.getStatus() == SagaStatus.INITIATED) {
                saga.setStatus(SagaStatus.REJECTED);
                sagaRepository.save(saga);
                log.info("[SAGA][{}] Saga ended — mentor rejected sessionId={}",
                        saga.getCorrelationId(), sessionId);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Query
    // ─────────────────────────────────────────────────────────────
    public SagaResponse getSagaBySessionId(Long sessionId) {
        return toResponse(sagaRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new SagaNotFoundException("No saga for sessionId=" + sessionId)));
    }

    // ─────────────────────────────────────────────────────────────
    // Internal helpers with Circuit Breaker + Retry
    // ─────────────────────────────────────────────────────────────
    @CircuitBreaker(name = "mentor-service")
    @Retry(name = "mentor-service")
    private BigDecimal fetchMentorRate(Long mentorId) {
        MentorRateDto response = mentorServiceClient.getMentorProfile(mentorId);
        if (response == null || response.getData() == null || response.getData().getHourlyRate() == null) {
            throw new RuntimeException("Could not fetch hourly rate for mentorId=" + mentorId);
        }
        return BigDecimal.valueOf(response.getData().getHourlyRate());
    }

    @CircuitBreaker(name = "session-service")
    @Retry(name = "session-service")
    private void updateSessionStatus(Long sessionId, String status) {
        sessionServiceClient.updateSessionStatus(sessionId, status);
        log.info("[SAGA] Session {} status updated to {}", sessionId, status);
    }

    private SagaResponse toResponse(PaymentSaga saga) {
        SagaResponse r = new SagaResponse();
        r.setSagaId(saga.getId());
        r.setSessionId(saga.getSessionId());
        r.setCorrelationId(saga.getCorrelationId());
        r.setLearnerId(saga.getLearnerId());
        r.setMentorId(saga.getMentorId());
        r.setAmount(saga.getAmount());
        r.setStatus(saga.getStatus());
        r.setPaymentReference(saga.getPaymentReference());
        r.setRefundReference(saga.getRefundReference());
        r.setFailureReason(saga.getFailureReason());
        r.setCreatedAt(saga.getCreatedAt());
        r.setUpdatedAt(saga.getUpdatedAt());
        return r;
    }
}

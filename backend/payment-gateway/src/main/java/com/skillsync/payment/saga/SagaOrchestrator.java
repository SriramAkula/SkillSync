package com.skillsync.payment.saga;

import com.skillsync.payment.client.MentorServiceClient;
import com.skillsync.payment.client.SessionServiceClient;
import com.skillsync.payment.client.dto.MentorRateDto;
import com.skillsync.payment.dto.request.StartSagaRequest;
import com.skillsync.payment.dto.request.VerifyPaymentRequest;
import com.skillsync.payment.dto.response.SagaResponse;
import com.skillsync.payment.entity.PaymentSaga;
import com.skillsync.payment.enums.SagaStatus;
import com.skillsync.payment.exception.SagaNotFoundException;
import com.skillsync.payment.audit.AuditService;
import com.skillsync.payment.mapper.PaymentSagaMapper;
import com.skillsync.payment.repository.PaymentSagaRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SagaOrchestrator {

    private final PaymentSagaRepository sagaRepository;
    private final MentorServiceClient mentorServiceClient;
    private final SessionServiceClient sessionServiceClient;
    private final PaymentProcessor paymentProcessor;
    private final PaymentSagaMapper sagaMapper;
    private final AuditService auditService;

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Start Saga
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public SagaResponse startSaga(StartSagaRequest request) {
        // 1. Fetch current session status to enforce strict flow
        String sessionStatus = "UNKNOWN";
        try {
            var sessionResponse = sessionServiceClient.getSession(request.getSessionId());
            if (sessionResponse != null && sessionResponse.getData() != null) {
                sessionStatus = sessionResponse.getData().getStatus();
            }
        } catch (Exception e) {
            log.warn("[SAGA] Could not verify session status for {}: {}", request.getSessionId(), e.getMessage());
        }

        var existingSaga = sagaRepository.findBySessionId(request.getSessionId());

        // 2. If saga already exists and is beyond INITIATED/FAILED/REJECTED, return as-is (idempotency)
        if (existingSaga.isPresent()) {
            PaymentSaga saga = existingSaga.get();
            SagaStatus status = saga.getStatus();

            if (status != SagaStatus.INITIATED && status != SagaStatus.FAILED && status != SagaStatus.REJECTED) {
                log.info("[SAGA] Returning existing saga (status={}) for sessionId={}", status, request.getSessionId());
                return sagaMapper.toDto(saga);
            }
        }

        // 3. Block if not ACCEPTED (Must be ACCEPTED to Start or Retry)
        if (!"ACCEPTED".equals(sessionStatus)) {
            log.warn("[SAGA] Rejecting startSaga for session {} - status is {}", request.getSessionId(), sessionStatus);
            throw new RuntimeException("Payment allowed only after mentor acceptance");
        }

        // 4. Handle existing Saga (INITIATED, FAILED, or REJECTED)
        if (existingSaga.isPresent()) {
            PaymentSaga saga = existingSaga.get();
            log.info("[SAGA] Restarting {} saga for session {}", saga.getStatus(), request.getSessionId());

            if (saga.getStatus() != SagaStatus.INITIATED) {
                saga.setStatus(SagaStatus.INITIATED);
                saga.setFailureReason(null);
                saga.setPaymentReference(null);
                saga = sagaRepository.save(saga);
            }
            return onSessionAccepted(saga.getSessionId(), saga.getMentorId(), saga.getLearnerId());
        }

        // 5. Create fresh Saga and move straight to order creation
        log.info("[SAGA] Starting new saga for session {}", request.getSessionId());
        PaymentSaga saga = sagaMapper.toEntity(request);
        saga.setStatus(SagaStatus.INITIATED);
        saga = sagaRepository.save(saga);

        auditService.log("PaymentSaga", saga.getId(), "SAGA_STARTED",
                saga.getLearnerId().toString(), "sessionId=" + saga.getSessionId());

        return onSessionAccepted(saga.getSessionId(), saga.getMentorId(), saga.getLearnerId());
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Mentor Accepted - create Razorpay order
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
            log.warn("[SAGA][{}] Ignoring session.accepted - current status={}",
                    saga.getCorrelationId(), saga.getStatus());
            return sagaMapper.toDto(saga);
        }

        try {
            BigDecimal hourlyRate = fetchMentorRate(saga.getMentorId());
            saga.setHourlyRate(hourlyRate);
            BigDecimal durationHours = BigDecimal.valueOf(saga.getDurationMinutes())
                    .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
            BigDecimal amount = hourlyRate.multiply(durationHours).setScale(2, RoundingMode.HALF_UP);
            saga.setAmount(amount);
            String razorpayOrderId = paymentProcessor.createOrder(saga.getCorrelationId(), amount);
            saga.setPaymentReference(razorpayOrderId);
            saga.setStatus(SagaStatus.PAYMENT_PENDING);
            sagaRepository.save(saga);
            auditService.log("PaymentSaga", saga.getId(), "ORDER_CREATED",
                    saga.getLearnerId().toString(), "orderId=" + razorpayOrderId + ",amount=" + amount);
            log.info("[SAGA][{}] Razorpay order created. orderId={}, amount={}",
                    saga.getCorrelationId(), razorpayOrderId, amount);
        } catch (Exception e) {
            log.error("[SAGA][{}] Failed to create Razorpay order: {}", saga.getCorrelationId(), e.getMessage());
            saga.setStatus(SagaStatus.FAILED);
            saga.setFailureReason(e.getMessage());
            sagaRepository.save(saga);
        }

        return sagaMapper.toDto(saga);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Verify Payment
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public SagaResponse verifyAndCompletePayment(VerifyPaymentRequest request) {
        PaymentSaga saga = sagaRepository.findBySessionId(request.getSessionId())
                .orElseThrow(() -> new SagaNotFoundException("No saga for sessionId=" + request.getSessionId()));

        if (saga.getStatus() != SagaStatus.PAYMENT_PENDING) {
            log.warn("[SAGA][{}] Verify called but status={}", saga.getCorrelationId(), saga.getStatus());
            return sagaMapper.toDto(saga);
        }

        saga.setStatus(SagaStatus.PAYMENT_PROCESSING);
        sagaRepository.save(saga);

        try {
            paymentProcessor.verifySignature(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature());
            String confirmedPaymentId = paymentProcessor.fetchAndConfirmPayment(request.getRazorpayPaymentId());
            saga.setPaymentReference(confirmedPaymentId);
            saga.setStatus(SagaStatus.COMPLETED);
            sagaRepository.save(saga);
            updateSessionStatus(saga.getSessionId(), "CONFIRMED");
            auditService.log("PaymentSaga", saga.getId(), "PAYMENT_COMPLETED",
                    saga.getLearnerId().toString(), "paymentId=" + confirmedPaymentId);
            log.info("[SAGA][{}] Payment COMPLETED. paymentId={}, sessionId={}",
                    saga.getCorrelationId(), confirmedPaymentId, saga.getSessionId());
        } catch (Exception e) {
            log.error("[SAGA][{}] Payment verification FAILED: {}", saga.getCorrelationId(), e.getMessage());
            saga.setStatus(SagaStatus.FAILED);
            saga.setFailureReason(e.getMessage());
            sagaRepository.save(saga);
            try {
                updateSessionStatus(saga.getSessionId(), "PAYMENT_FAILED");
            } catch (Exception ex) {
                log.error("[SAGA][{}] Failed to update session after payment failure: {}",
                        saga.getCorrelationId(), ex.getMessage());
            }
        }

        return sagaMapper.toDto(saga);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Refund
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public SagaResponse initiateRefund(Long sessionId) {
        PaymentSaga saga = sagaRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new SagaNotFoundException("No saga for sessionId=" + sessionId));

        if (saga.getStatus() != SagaStatus.COMPLETED) {
            log.warn("[SAGA][{}] Refund skipped - status={} (no payment made)",
                    saga.getCorrelationId(), saga.getStatus());
            return sagaMapper.toDto(saga);
        }

        if (saga.getStatus() == SagaStatus.REFUNDED || saga.getStatus() == SagaStatus.REFUND_INITIATED) {
            log.warn("[SAGA][{}] Refund already processed", saga.getCorrelationId());
            return sagaMapper.toDto(saga);
        }

        saga.setStatus(SagaStatus.REFUND_INITIATED);
        sagaRepository.save(saga);

        try {
            String refundId = paymentProcessor.refund(saga.getPaymentReference(), saga.getAmount());
            saga.setRefundReference(refundId);
            saga.setStatus(SagaStatus.REFUNDED);
            sagaRepository.save(saga);
            updateSessionStatus(sessionId, "REFUNDED");
            auditService.log("PaymentSaga", saga.getId(), "REFUND_COMPLETED",
                    saga.getLearnerId().toString(), "refundId=" + refundId);
            log.info("[SAGA][{}] Refund COMPLETED. refundId={}", saga.getCorrelationId(), refundId);
        } catch (Exception e) {
            log.error("[SAGA][{}] Refund FAILED: {}", saga.getCorrelationId(), e.getMessage());
            saga.setStatus(SagaStatus.COMPENSATION_FAILED);
            saga.setFailureReason("Refund failed: " + e.getMessage());
            sagaRepository.save(saga);
        }

        return sagaMapper.toDto(saga);
    }

    // ─────────────────────────────────────────────────────────────
    // Mentor Rejected
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public void onSessionRejected(Long sessionId) {
        sagaRepository.findBySessionId(sessionId).ifPresent(saga -> {
            if (saga.getStatus() == SagaStatus.INITIATED) {
                saga.setStatus(SagaStatus.REJECTED);
                sagaRepository.save(saga);
                log.info("[SAGA][{}] Saga ended - mentor rejected sessionId={}",
                        saga.getCorrelationId(), sessionId);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Query
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public SagaResponse getSagaBySessionId(Long sessionId) {
        PaymentSaga saga = sagaRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new SagaNotFoundException("No saga for sessionId=" + sessionId));

        // Proactively advance if status is INITIATED but session is already ACCEPTED
        if (saga.getStatus() == SagaStatus.INITIATED) {
            try {
                var sessionResponse = sessionServiceClient.getSession(sessionId);
                if (sessionResponse != null && sessionResponse.getData() != null && "ACCEPTED".equals(sessionResponse.getData().getStatus())) {
                    log.info("[SAGA] Query found INITIATED saga for accepted session {}. Advancing proactively.", sessionId);
                    return onSessionAccepted(saga.getSessionId(), saga.getMentorId(), saga.getLearnerId());
                }
            } catch (Exception e) {
                log.warn("[SAGA] Proactive check failed in query for session {}: {}", sessionId, e.getMessage());
            }
        }

        return sagaMapper.toDto(saga);
    }

    // ─────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────
    @CircuitBreaker(name = "mentor-service")
    @Retry(name = "mentor-service")
    private BigDecimal fetchMentorRate(Long mentorId) {
        MentorRateDto response = mentorServiceClient.fetchMentorProfileForSaga(mentorId);
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
}

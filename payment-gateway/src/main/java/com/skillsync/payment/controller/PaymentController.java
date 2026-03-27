package com.skillsync.payment.controller;

import com.skillsync.payment.dto.request.RefundRequest;
import com.skillsync.payment.dto.request.StartSagaRequest;
import com.skillsync.payment.dto.request.VerifyPaymentRequest;
import com.skillsync.payment.dto.response.ApiResponse;
import com.skillsync.payment.dto.response.SagaResponse;
import com.skillsync.payment.saga.SagaOrchestrator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@Tag(name = "Payment Saga", description = "Orchestration-based Saga for session payments via Razorpay")
public class PaymentController {

    private final SagaOrchestrator sagaOrchestrator;

    public PaymentController(SagaOrchestrator sagaOrchestrator) {
        this.sagaOrchestrator = sagaOrchestrator;
    }

    /**
     * STEP 1 — Start saga when session is created.
     * Called by session-service or learner flow.
     */
    @PostMapping("/start-saga")
    @Operation(summary = "Start payment saga",
               description = "Initiates saga when a session is created. Waits for mentor acceptance.")
    public ResponseEntity<ApiResponse<SagaResponse>> startSaga(@Valid @RequestBody StartSagaRequest request) {
        SagaResponse response = sagaOrchestrator.startSaga(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, response,
                        "Saga initiated. Waiting for mentor acceptance.", 201));
    }

    /**
     * STEP 2 — Mentor accepted (REST fallback).
     * Normally triggered via session.accepted RabbitMQ event.
     * Creates Razorpay order and returns order_id for frontend checkout.
     */
    @PostMapping("/process")
    @Operation(summary = "Process payment (REST fallback)",
               description = "Triggered when mentor accepts. Creates Razorpay order. Returns order_id for frontend.")
    public ResponseEntity<ApiResponse<SagaResponse>> processPayment(@RequestParam Long sessionId) {
        SagaResponse current = sagaOrchestrator.getSagaBySessionId(sessionId);
        SagaResponse response = sagaOrchestrator.onSessionAccepted(
                sessionId, current.getMentorId(), current.getLearnerId());
        return ResponseEntity.ok(new ApiResponse<>(true, response,
                "Razorpay order created. Use paymentReference (order_id) in frontend checkout.", 200));
    }

    /**
     * STEP 3 — Verify payment after Razorpay Checkout completes.
     * Frontend sends razorpay_order_id, razorpay_payment_id, razorpay_signature.
     * Backend verifies signature → confirms payment → marks session CONFIRMED.
     */
    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment",
               description = "Called by frontend after Razorpay Checkout. Verifies signature and confirms session.")
    public ResponseEntity<ApiResponse<SagaResponse>> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request) {
        SagaResponse response = sagaOrchestrator.verifyAndCompletePayment(request);
        return ResponseEntity.ok(new ApiResponse<>(true, response,
                "Payment verified and session confirmed.", 200));
    }

    /**
     * STEP 4 — Initiate refund on cancellation (REST fallback).
     * Normally triggered via session.cancelled RabbitMQ event.
     */
    @PostMapping("/refund")
    @Operation(summary = "Initiate refund",
               description = "Trigger Razorpay refund for a cancelled session.")
    public ResponseEntity<ApiResponse<SagaResponse>> refund(@Valid @RequestBody RefundRequest request) {
        SagaResponse response = sagaOrchestrator.initiateRefund(request.getSessionId());
        return ResponseEntity.ok(new ApiResponse<>(true, response, "Refund initiated.", 200));
    }

    /**
     * Query saga state by sessionId.
     */
    @GetMapping("/saga/{sessionId}")
    @Operation(summary = "Get saga status",
               description = "Retrieve current saga state and payment details for a session.")
    public ResponseEntity<ApiResponse<SagaResponse>> getSaga(@PathVariable Long sessionId) {
        SagaResponse response = sagaOrchestrator.getSagaBySessionId(sessionId);
        return ResponseEntity.ok(new ApiResponse<>(true, response, "Saga retrieved.", 200));
    }
}

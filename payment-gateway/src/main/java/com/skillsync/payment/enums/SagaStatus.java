package com.skillsync.payment.enums;

public enum SagaStatus {
    INITIATED,          // Saga started, waiting for mentor action
    PAYMENT_PENDING,    // Mentor accepted, payment about to be processed
    PAYMENT_PROCESSING, // Payment call in progress
    COMPLETED,          // Payment succeeded, session confirmed
    FAILED,             // Payment failed
    REJECTED,           // Mentor rejected the session
    REFUND_INITIATED,   // Cancellation received, refund started
    REFUNDED,           // Refund completed
    COMPENSATION_FAILED // Refund attempt failed
}

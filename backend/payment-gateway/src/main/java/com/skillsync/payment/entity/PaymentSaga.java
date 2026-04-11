package com.skillsync.payment.entity;

import com.skillsync.payment.enums.SagaStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.skillsync.payment.audit.Auditable;
import lombok.*;

@Entity
@Table(name = "payment_saga", indexes = {
        @Index(name = "idx_session_id", columnList = "session_id", unique = true),
        @Index(name = "idx_correlation_id", columnList = "correlation_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSaga extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Idempotency key - one saga per session
    @Column(name = "session_id", nullable = false, unique = true)
    private Long sessionId;

    @Column(name = "correlation_id", nullable = false, unique = true)
    private String correlationId; // UUID for distributed tracing

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "mentor_id", nullable = false)
    private Long mentorId;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "amount", precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SagaStatus status = SagaStatus.INITIATED;

    @Column(name = "payment_reference")
    private String paymentReference; // External payment provider reference

    @Column(name = "refund_reference")
    private String refundReference;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "retry_count")
    private int retryCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}

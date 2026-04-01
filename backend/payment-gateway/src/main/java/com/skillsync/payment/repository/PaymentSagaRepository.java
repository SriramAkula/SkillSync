package com.skillsync.payment.repository;

import com.skillsync.payment.entity.PaymentSaga;
import com.skillsync.payment.enums.SagaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentSagaRepository extends JpaRepository<PaymentSaga, Long> {
    Optional<PaymentSaga> findBySessionId(Long sessionId);
    Optional<PaymentSaga> findByCorrelationId(String correlationId);
    boolean existsBySessionIdAndStatusIn(Long sessionId, java.util.List<SagaStatus> statuses);
}

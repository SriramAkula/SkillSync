package com.skillsync.payment.mapper;

import com.skillsync.payment.dto.request.StartSagaRequest;
import com.skillsync.payment.dto.response.SagaResponse;
import com.skillsync.payment.entity.PaymentSaga;
import com.skillsync.payment.enums.SagaStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PaymentSagaMapper {

    // StartSagaRequest -> PaymentSaga entity
    public PaymentSaga toEntity(StartSagaRequest request) {
        PaymentSaga saga = new PaymentSaga();
        saga.setSessionId(request.getSessionId());
        saga.setLearnerId(request.getLearnerId());
        saga.setMentorId(request.getMentorId());
        saga.setDurationMinutes(request.getDurationMinutes());
        saga.setCorrelationId(UUID.randomUUID().toString());
        saga.setStatus(SagaStatus.INITIATED);
        return saga;
    }

    // PaymentSaga entity -> SagaResponse
    public SagaResponse toDto(PaymentSaga saga) {
        SagaResponse response = new SagaResponse();
        response.setSagaId(saga.getId());
        response.setSessionId(saga.getSessionId());
        response.setCorrelationId(saga.getCorrelationId());
        response.setLearnerId(saga.getLearnerId());
        response.setMentorId(saga.getMentorId());
        response.setAmount(saga.getAmount());
        response.setStatus(saga.getStatus());
        response.setPaymentReference(saga.getPaymentReference());
        response.setRefundReference(saga.getRefundReference());
        response.setFailureReason(saga.getFailureReason());
        response.setCreatedAt(saga.getCreatedAt());
        response.setUpdatedAt(saga.getUpdatedAt());
        return response;
    }
}

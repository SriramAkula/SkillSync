package com.skillsync.payment.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.skillsync.payment.dto.request.StartSagaRequest;
import com.skillsync.payment.dto.response.SagaResponse;
import com.skillsync.payment.entity.PaymentSaga;
import com.skillsync.payment.enums.SagaStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

class PaymentSagaMapperTest {

    private final PaymentSagaMapper mapper = new PaymentSagaMapper();

    @Test
    void toEntity_shouldMapCorrectly() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(1L);
        request.setMentorId(10L);
        request.setLearnerId(100L);
        request.setDurationMinutes(60);

        PaymentSaga entity = mapper.toEntity(request);

        assertThat(entity.getSessionId()).isEqualTo(1L);
        assertThat(entity.getMentorId()).isEqualTo(10L);
        assertThat(entity.getLearnerId()).isEqualTo(100L);
        assertThat(entity.getDurationMinutes()).isEqualTo(60);
        assertThat(entity.getCorrelationId()).isNotNull();
    }

    @Test
    void toDto_shouldMapCorrectly() {
        PaymentSaga saga = new PaymentSaga();
        saga.setId(1L);
        saga.setSessionId(10L);
        saga.setStatus(SagaStatus.COMPLETED);
        saga.setAmount(new BigDecimal("50.00"));
        saga.setPaymentReference("PAY123");

        SagaResponse dto = mapper.toDto(saga);

        assertThat(dto.getSagaId()).isEqualTo(1L);
        assertThat(dto.getSessionId()).isEqualTo(10L);
        assertThat(dto.getStatus()).isEqualTo(SagaStatus.COMPLETED);
        assertThat(dto.getAmount()).isEqualTo(new BigDecimal("50.00"));
        assertThat(dto.getPaymentReference()).isEqualTo("PAY123");
    }
}

package com.skillsync.payment.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.payment.dto.request.StartSagaRequest;
import com.skillsync.payment.dto.request.VerifyPaymentRequest;
import com.skillsync.payment.dto.response.SagaResponse;
import com.skillsync.payment.enums.SagaStatus;
import com.skillsync.payment.saga.SagaOrchestrator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PaymentController.class)
class PaymentControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private SagaOrchestrator sagaOrchestrator;
    @Autowired private ObjectMapper objectMapper;

    private SagaResponse sagaResponse;

    @BeforeEach
    void setUp() {
        sagaResponse = new SagaResponse();
        sagaResponse.setSagaId(1L);
        sagaResponse.setSessionId(100L);
        sagaResponse.setStatus(SagaStatus.INITIATED);
    }

    @Test
    void startSaga_shouldReturnCreated() throws Exception {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        request.setLearnerId(50L);
        request.setMentorId(10L);
        request.setDurationMinutes(60);
        when(sagaOrchestrator.startSaga(any())).thenReturn(sagaResponse);

        mockMvc.perform(post("/payments/start-saga")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated()) 
                .andExpect(jsonPath("$.data.sagaId").value(1));
    }

    @Test
    void verifyPayment_shouldReturnOk() throws Exception {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setSessionId(100L);
        request.setRazorpayOrderId("order_1");
        request.setRazorpayPaymentId("pay_1");
        request.setRazorpaySignature("sig_1");
        when(sagaOrchestrator.verifyAndCompletePayment(any())).thenReturn(sagaResponse);

        mockMvc.perform(post("/payments/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionId").value(100));
    }

    @Test
    void getSagaStatus_shouldReturnOk() throws Exception {
        when(sagaOrchestrator.getSagaBySessionId(100L)).thenReturn(sagaResponse);

        mockMvc.perform(get("/payments/saga/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INITIATED"));
    }

    @Test
    void processPayment_shouldReturnOk() throws Exception {
        when(sagaOrchestrator.getSagaBySessionId(100L)).thenReturn(sagaResponse);
        when(sagaOrchestrator.onSessionAccepted(anyLong(), anyLong(), anyLong())).thenReturn(sagaResponse);

        mockMvc.perform(post("/payments/process?sessionId=100"))
                .andExpect(status().isOk());
    }

    @Test
    void refund_shouldReturnOk() throws Exception {
        when(sagaOrchestrator.initiateRefund(anyLong())).thenReturn(sagaResponse);

        mockMvc.perform(post("/payments/refund")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\": 100}"))
                .andExpect(status().isOk());
    }
}

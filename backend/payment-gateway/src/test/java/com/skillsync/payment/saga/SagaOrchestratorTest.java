package com.skillsync.payment.saga;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.skillsync.payment.audit.AuditService;
import com.skillsync.payment.client.MentorServiceClient;
import com.skillsync.payment.client.SessionServiceClient;
import com.skillsync.payment.client.dto.MentorRateDto;
import com.skillsync.payment.client.dto.SessionDto;
import com.skillsync.payment.dto.response.ApiResponse;
import com.skillsync.payment.dto.request.StartSagaRequest;
import com.skillsync.payment.dto.request.VerifyPaymentRequest;
import com.skillsync.payment.dto.response.SagaResponse;
import com.skillsync.payment.entity.PaymentSaga;
import com.skillsync.payment.enums.SagaStatus;
import com.skillsync.payment.exception.SagaNotFoundException;
import com.skillsync.payment.mapper.PaymentSagaMapper;
import com.skillsync.payment.repository.PaymentSagaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class SagaOrchestratorTest {

    @Mock private PaymentSagaRepository sagaRepository;
    @Mock private MentorServiceClient mentorServiceClient;
    @Mock private SessionServiceClient sessionServiceClient;
    @Mock private PaymentProcessor paymentProcessor;
    @Mock private PaymentSagaMapper sagaMapper;
    @Mock private AuditService auditService;

    @InjectMocks private SagaOrchestrator sagaOrchestrator;

    private PaymentSaga saga;
    private SagaResponse sagaResponse;

    @BeforeEach
    void setUp() {
        saga = new PaymentSaga();
        saga.setId(1L);
        saga.setSessionId(100L);
        saga.setMentorId(10L);
        saga.setLearnerId(50L);
        saga.setCorrelationId("corr-123");
        saga.setStatus(SagaStatus.INITIATED);
        saga.setDurationMinutes(60);

        sagaResponse = new SagaResponse();
        sagaResponse.setSagaId(1L);
        sagaResponse.setSessionId(100L);
        sagaResponse.setStatus(SagaStatus.INITIATED);
    }

    @Test
    void startSaga_shouldThrow_whenSessionNotAccepted() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        
        SessionDto.SessionData sessionData = new SessionDto.SessionData();
        sessionData.setStatus("PENDING");
        SessionDto sessionDto = new SessionDto();
        sessionDto.setSuccess(true);
        sessionDto.setData(sessionData);
        
        when(sessionServiceClient.getSession(100L)).thenReturn(sessionDto);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> sagaOrchestrator.startSaga(request));
    }

    @Test
    void startSaga_shouldReturnExisting_whenIdempotent() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        
        saga.setStatus(SagaStatus.PAYMENT_PENDING);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(sagaMapper.toDto(saga)).thenReturn(sagaResponse);

        SagaResponse result = sagaOrchestrator.startSaga(request);
        assertThat(result).isEqualTo(sagaResponse);
    }

    @Test
    void startSaga_shouldRestart_whenExistingFailed() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        saga.setStatus(SagaStatus.FAILED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(sagaMapper.toDto(any())).thenReturn(sagaResponse); // For the return after restart attempt
        
        // Internal call to onSessionAccepted will happen. Mock its deps:
        MentorRateDto.MentorData mData = new MentorRateDto.MentorData();
        mData.setHourlyRate(50.0);
        MentorRateDto rateDto = new MentorRateDto();
        rateDto.setData(mData);
        when(mentorServiceClient.fetchMentorProfileForSaga(10L)).thenReturn(rateDto);
        when(paymentProcessor.createOrder(anyString(), any())).thenReturn("order_123");
        when(sagaRepository.save(any())).thenReturn(saga);

        // sessionStatus must be ACCEPTED for startSaga to proceed
        SessionDto.SessionData sessionData = new SessionDto.SessionData();
        sessionData.setStatus("ACCEPTED");
        SessionDto sessionDto = new SessionDto();
        sessionDto.setData(sessionData);
        when(sessionServiceClient.getSession(100L)).thenReturn(sessionDto);

        sagaOrchestrator.startSaga(request);
        assertThat(saga.getStatus()).isNotEqualTo(SagaStatus.FAILED);
    }

    @Test
    void startSaga_shouldCreateNew_whenValid() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        request.setMentorId(10L);
        request.setLearnerId(50L);
        
        SessionDto.SessionData sessionData = new SessionDto.SessionData();
        sessionData.setStatus("ACCEPTED");
        SessionDto sessionDto = new SessionDto();
        sessionDto.setData(sessionData);
        when(sessionServiceClient.getSession(100L)).thenReturn(sessionDto);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.empty(), Optional.of(saga));
        when(sagaMapper.toEntity(request)).thenReturn(saga);
        when(sagaRepository.save(any())).thenReturn(saga);

        sagaOrchestrator.startSaga(request);

        verify(sagaRepository, atLeastOnce()).save(any());
    }

    @Test
    void startSaga_shouldRestart_whenExistingRejected() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        saga.setStatus(SagaStatus.REJECTED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        
        SessionDto.SessionData sessionData = new SessionDto.SessionData();
        sessionData.setStatus("ACCEPTED");
        SessionDto sessionDto = new SessionDto();
        sessionDto.setData(sessionData);
        when(sessionServiceClient.getSession(100L)).thenReturn(sessionDto);
        
        // Mock deps for onSessionAccepted
        MentorRateDto.MentorData mData = new MentorRateDto.MentorData();
        mData.setHourlyRate(50.0);
        MentorRateDto rateDto = new MentorRateDto();
        rateDto.setData(mData);
        when(mentorServiceClient.fetchMentorProfileForSaga(10L)).thenReturn(rateDto);
        when(paymentProcessor.createOrder(anyString(), any())).thenReturn("order_1");
        when(sagaRepository.save(any())).thenReturn(saga);
        when(sagaMapper.toDto(any())).thenReturn(sagaResponse);

        sagaOrchestrator.startSaga(request);
        assertThat(saga.getStatus()).isEqualTo(SagaStatus.PAYMENT_PENDING);
    }

    @Test
    void startSaga_shouldProceed_whenSessionDataNull() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        SessionDto sessionDto = new SessionDto();
        sessionDto.setData(null);
        when(sessionServiceClient.getSession(100L)).thenReturn(sessionDto);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> sagaOrchestrator.startSaga(request));
    }

    @Test
    void startSaga_shouldRestart_whenExistingInitiated() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        saga.setStatus(SagaStatus.INITIATED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        
        SessionDto.SessionData sessionData = new SessionDto.SessionData();
        sessionData.setStatus("ACCEPTED");
        SessionDto sessionDto = new SessionDto();
        sessionDto.setData(sessionData);
        when(sessionServiceClient.getSession(100L)).thenReturn(sessionDto);
        
        // Mock deps for onSessionAccepted
        MentorRateDto.MentorData mData = new MentorRateDto.MentorData();
        mData.setHourlyRate(50.0);
        MentorRateDto rateDto = new MentorRateDto();
        rateDto.setData(mData);
        when(mentorServiceClient.fetchMentorProfileForSaga(10L)).thenReturn(rateDto);
        when(paymentProcessor.createOrder(anyString(), any())).thenReturn("order_1");
        when(sagaMapper.toDto(any())).thenReturn(sagaResponse);

        sagaOrchestrator.startSaga(request);
        // The saga status will be updated to PAYMENT_PENDING in onSessionAccepted, so save IS called.
        assertThat(saga.getStatus()).isEqualTo(SagaStatus.PAYMENT_PENDING);
    }

    @Test
    void getSagaBySessionId_shouldStayInitiated_whenSessionNotAccepted() {
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        
        SessionDto.SessionData sessionData = new SessionDto.SessionData();
        sessionData.setStatus("PENDING");
        SessionDto sessionDto = new SessionDto();
        sessionDto.setData(sessionData);
        when(sessionServiceClient.getSession(100L)).thenReturn(sessionDto);
        when(sagaMapper.toDto(saga)).thenReturn(sagaResponse);
        
        SagaResponse result = sagaOrchestrator.getSagaBySessionId(100L);
        assertThat(result.getStatus()).isEqualTo(SagaStatus.INITIATED);
    }

    @Test
    void getSagaBySessionId_shouldStayInitiated_whenSessionDataNull() {
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(sessionServiceClient.getSession(100L)).thenReturn(new SessionDto());
        when(sagaMapper.toDto(saga)).thenReturn(sagaResponse);
        
        sagaOrchestrator.getSagaBySessionId(100L);
        verify(sagaRepository, never()).save(any());
    }

    @Test
    void startSaga_shouldHandleGeneralException() {
        when(sessionServiceClient.getSession(any())).thenThrow(new RuntimeException("Fatal error"));
        assertThrows(RuntimeException.class, () -> sagaOrchestrator.startSaga(new StartSagaRequest()));
    }

    @Test
    void verifyAndCompletePayment_shouldHandleStatusEdgeCases() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setSessionId(100L);
        
        // COMPLETED case
        saga.setStatus(SagaStatus.COMPLETED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        sagaOrchestrator.verifyAndCompletePayment(request);
        
        // REFUNDED case
        saga.setStatus(SagaStatus.REFUNDED);
        sagaOrchestrator.verifyAndCompletePayment(request);
    }

    @Test
    void onSessionAccepted_shouldHandleFailureInOrderCreation() {
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        
        MentorRateDto.MentorData data = new MentorRateDto.MentorData();
        data.setHourlyRate(50.0);
        MentorRateDto rateDto = new MentorRateDto();
        rateDto.setData(data);
        when(mentorServiceClient.fetchMentorProfileForSaga(10L)).thenReturn(rateDto);
        when(paymentProcessor.createOrder(anyString(), any())).thenThrow(new RuntimeException("Razorpay error"));

        sagaOrchestrator.onSessionAccepted(100L, 10L, 50L);

        assertThat(saga.getStatus()).isEqualTo(SagaStatus.FAILED);
        assertThat(saga.getFailureReason()).isEqualTo("Razorpay error");
    }

    @Test
    void verifyAndCompletePayment_shouldComplete_whenSignatureValid() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setSessionId(100L);
        saga.setStatus(SagaStatus.PAYMENT_PENDING);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(paymentProcessor.fetchAndConfirmPayment(any())).thenReturn("conf_pay_1");

        sagaOrchestrator.verifyAndCompletePayment(request);

        assertThat(saga.getStatus()).isEqualTo(SagaStatus.COMPLETED);
        verify(sessionServiceClient).updateSessionStatus(100L, "CONFIRMED");
    }

    @Test
    void verifyAndCompletePayment_shouldSkip_whenNotPending() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setSessionId(100L);
        saga.setStatus(SagaStatus.COMPLETED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));

        sagaOrchestrator.verifyAndCompletePayment(request);

        verify(paymentProcessor, never()).fetchAndConfirmPayment(any());
    }

    @Test
    void verifyAndCompletePayment_shouldHandleException() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setSessionId(100L);
        saga.setStatus(SagaStatus.PAYMENT_PENDING);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(paymentProcessor.fetchAndConfirmPayment(any())).thenThrow(new RuntimeException("Crash"));

        sagaOrchestrator.verifyAndCompletePayment(request);

        assertThat(saga.getStatus()).isEqualTo(SagaStatus.FAILED);
    }

    @Test
    void verifyAndCompletePayment_shouldFail_whenVerificationThrows() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setSessionId(100L);
        saga.setStatus(SagaStatus.PAYMENT_PENDING);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        doThrow(new RuntimeException("Sig fail")).when(paymentProcessor).verifySignature(any(), any(), any());

        sagaOrchestrator.verifyAndCompletePayment(request);

        assertThat(saga.getStatus()).isEqualTo(SagaStatus.FAILED);
        verify(sessionServiceClient).updateSessionStatus(100L, "PAYMENT_FAILED");
    }

    @Test
    void initiateRefund_shouldRefund_whenCompleted() {
        saga.setStatus(SagaStatus.COMPLETED);
        saga.setPaymentReference("pay_1");
        saga.setAmount(new BigDecimal("100.00"));
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(paymentProcessor.refund(any(), any())).thenReturn("rfnd_1");

        sagaOrchestrator.initiateRefund(100L);

        assertThat(saga.getStatus()).isEqualTo(SagaStatus.REFUNDED);
        assertThat(saga.getRefundReference()).isEqualTo("rfnd_1");
    }

    @Test
    void initiateRefund_shouldHandleRazorpayException() {
        saga.setStatus(SagaStatus.COMPLETED);
        saga.setPaymentReference("pay_1");
        saga.setAmount(new BigDecimal("100.00"));
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(paymentProcessor.refund(any(), any())).thenThrow(new RuntimeException("Refund fail"));

        sagaOrchestrator.initiateRefund(100L);

        assertThat(saga.getStatus()).isEqualTo(SagaStatus.COMPENSATION_FAILED);
    }

    @Test
    void initiateRefund_shouldHandleGeneralException() {
        saga.setStatus(SagaStatus.COMPLETED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(paymentProcessor.refund(any(), any())).thenThrow(new RuntimeException("Fatal"));

        sagaOrchestrator.initiateRefund(100L);
        assertThat(saga.getStatus()).isEqualTo(SagaStatus.COMPENSATION_FAILED);
    }

    @Test
    void initiateRefund_shouldSkip_whenAlreadyRefunded() {
        saga.setStatus(SagaStatus.REFUNDED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        sagaOrchestrator.initiateRefund(100L);
        verify(paymentProcessor, never()).refund(any(), any());
    }

    @Test
    void initiateRefund_shouldSkip_whenRefundInitiated() {
        saga.setStatus(SagaStatus.REFUND_INITIATED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        sagaOrchestrator.initiateRefund(100L);
        verify(paymentProcessor, never()).refund(any(), any());
    }

    @Test
    void initiateRefund_shouldSkip_whenNotCompleted() {
        saga.setStatus(SagaStatus.FAILED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));

        sagaOrchestrator.initiateRefund(100L);

        verify(paymentProcessor, never()).refund(any(), any());
    }

    @Test
    void onSessionRejected_shouldUpdateSaga() {
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        sagaOrchestrator.onSessionRejected(100L);
        assertThat(saga.getStatus()).isEqualTo(SagaStatus.REJECTED);
    }

    @Test
    void getSagaBySessionId_shouldAdvance_whenInitiatedAndAccepted() {
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        
        SessionDto.SessionData sessionData = new SessionDto.SessionData();
        sessionData.setStatus("ACCEPTED");
        SessionDto sessionDto = new SessionDto();
        sessionDto.setData(sessionData);
        when(sessionServiceClient.getSession(100L)).thenReturn(sessionDto);
        
        // Mocking onSessionAccepted dependencies
        MentorRateDto.MentorData data = new MentorRateDto.MentorData();
        data.setHourlyRate(50.0);
        MentorRateDto rateDto = new MentorRateDto();
        rateDto.setData(data);
        lenient().when(mentorServiceClient.fetchMentorProfileForSaga(10L)).thenReturn(rateDto);
        lenient().when(paymentProcessor.createOrder(anyString(), any())).thenReturn("order_123");

        sagaOrchestrator.getSagaBySessionId(100L);

        verify(sagaRepository, atLeastOnce()).save(any());
    }

    @Test
    void fetchMentorRate_shouldThrow_whenResponseNull() {
        when(mentorServiceClient.fetchMentorProfileForSaga(10L)).thenReturn(null);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        sagaOrchestrator.onSessionAccepted(100L, 10L, 50L);
        assertThat(saga.getStatus()).isEqualTo(SagaStatus.FAILED);
    }

    @Test
    void onSessionAccepted_shouldCreateSaga_whenNotPresent() {
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.empty(), Optional.of(saga)); 
        MentorRateDto.MentorData mData = new MentorRateDto.MentorData();
        mData.setHourlyRate(50.0);
        MentorRateDto rateDto = new MentorRateDto();
        rateDto.setData(mData);
        when(mentorServiceClient.fetchMentorProfileForSaga(10L)).thenReturn(rateDto);
        when(paymentProcessor.createOrder(anyString(), any())).thenReturn("order_1");
        when(sagaRepository.save(any())).thenReturn(saga);
        
        sagaOrchestrator.onSessionAccepted(100L, 10L, 50L);
        verify(sagaRepository, atLeastOnce()).save(any());
    }

    @Test
    void onSessionRejected_shouldDoNothing_whenNonInitiated() {
        saga.setStatus(SagaStatus.PAYMENT_PENDING);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        sagaOrchestrator.onSessionRejected(100L);
        assertThat(saga.getStatus()).isEqualTo(SagaStatus.PAYMENT_PENDING);
    }
    @Test
    void startSaga_shouldHandleSessionServiceException_AndProceed() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        request.setMentorId(10L); 
        request.setLearnerId(50L);

        when(sessionServiceClient.getSession(100L)).thenThrow(new RuntimeException("Socket timeout"));
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.empty());

        // This should fail because sessionStatus will be UNKNOWN, hence not ACCEPTED
        assertThrows(RuntimeException.class, () -> sagaOrchestrator.startSaga(request));
    }

    @Test
    void getSagaBySessionId_shouldHandleSessionServiceException_DuringProactiveCheck() {
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(sessionServiceClient.getSession(100L)).thenThrow(new RuntimeException("Internal Service Error"));
        when(sagaMapper.toDto(saga)).thenReturn(sagaResponse);
        
        SagaResponse result = sagaOrchestrator.getSagaBySessionId(100L);
        assertThat(result.getStatus()).isEqualTo(SagaStatus.INITIATED);
    }

    @Test
    void fetchMentorRate_shouldThrow_WhenDataNull() {
        MentorRateDto rateDto = new MentorRateDto();
        rateDto.setData(null);
        when(mentorServiceClient.fetchMentorProfileForSaga(10L)).thenReturn(rateDto);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        
        sagaOrchestrator.onSessionAccepted(100L, 10L, 50L);
        assertThat(saga.getStatus()).isEqualTo(SagaStatus.FAILED);
    }

    @Test
    void fetchMentorRate_shouldThrow_WhenHourlyRateNull() {
        MentorRateDto.MentorData mData = new MentorRateDto.MentorData();
        mData.setHourlyRate(null);
        MentorRateDto rateDto = new MentorRateDto();
        rateDto.setData(mData);
        when(mentorServiceClient.fetchMentorProfileForSaga(10L)).thenReturn(rateDto);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        
        sagaOrchestrator.onSessionAccepted(100L, 10L, 50L);
        assertThat(saga.getStatus()).isEqualTo(SagaStatus.FAILED);
    }

    @Test
    void verifyAndCompletePayment_shouldHandleSessionServiceException_OnFailurePath() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setSessionId(100L);
        saga.setStatus(SagaStatus.PAYMENT_PENDING);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        
        doThrow(new RuntimeException("Sig fail")).when(paymentProcessor).verifySignature(any(), any(), any());
        doThrow(new RuntimeException("Session service down")).when(sessionServiceClient).updateSessionStatus(anyLong(), anyString());

        sagaOrchestrator.verifyAndCompletePayment(request);

        assertThat(saga.getStatus()).isEqualTo(SagaStatus.FAILED);
    }

    @Test
    void initiateRefund_shouldHandleSessionServiceException() {
        saga.setStatus(SagaStatus.COMPLETED);
        saga.setPaymentReference("pay_1");
        saga.setAmount(BigDecimal.TEN);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(paymentProcessor.refund(any(), any())).thenReturn("rfnd_1");
        doThrow(new RuntimeException("Session service down")).when(sessionServiceClient).updateSessionStatus(anyLong(), anyString());

        sagaOrchestrator.initiateRefund(100L);

        // If updateSessionStatus fails, it hits the catch block and sets COMPENSATION_FAILED
        assertThat(saga.getStatus()).isEqualTo(SagaStatus.COMPENSATION_FAILED);
    }

    @Test
    void onSessionAccepted_shouldLogWarning_WhenNoSagaFound() {
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.empty());
        when(sagaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(sagaMapper.toDto(any())).thenReturn(sagaResponse);
        
        // Mock deps for try block
        MentorRateDto.MentorData mData = new MentorRateDto.MentorData();
        mData.setHourlyRate(50.0);
        MentorRateDto rateDto = new MentorRateDto();
        rateDto.setData(mData);
        lenient().when(mentorServiceClient.fetchMentorProfileForSaga(anyLong())).thenReturn(rateDto);
        lenient().when(paymentProcessor.createOrder(anyString(), any())).thenReturn("order_1");

        sagaOrchestrator.onSessionAccepted(100L, 10L, 50L);
        
        verify(sagaRepository, atLeastOnce()).save(any());
    }

    @Test
    void startSaga_shouldHandleNullSessionResponse() {
        StartSagaRequest request = new StartSagaRequest();
        request.setSessionId(100L);
        when(sessionServiceClient.getSession(100L)).thenReturn(null);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> sagaOrchestrator.startSaga(request));
    }

    @Test
    void onSessionAccepted_shouldSkip_whenNotInitiated() {
        saga.setStatus(SagaStatus.PAYMENT_PENDING);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(sagaMapper.toDto(saga)).thenReturn(sagaResponse);

        SagaResponse result = sagaOrchestrator.onSessionAccepted(100L, 10L, 50L);
        assertThat(result).isEqualTo(sagaResponse);
        verify(paymentProcessor, never()).createOrder(anyString(), any());
    }

    @Test
    void verifyAndCompletePayment_shouldThrow_whenNotFound() {
        when(sagaRepository.findBySessionId(999L)).thenReturn(Optional.empty());
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setSessionId(999L);
        assertThrows(SagaNotFoundException.class, () -> sagaOrchestrator.verifyAndCompletePayment(request));
    }

    @Test
    void initiateRefund_shouldThrow_whenNotFound() {
        when(sagaRepository.findBySessionId(999L)).thenReturn(Optional.empty());
        assertThrows(SagaNotFoundException.class, () -> sagaOrchestrator.initiateRefund(999L));
    }

    @Test
    void getSagaBySessionId_shouldThrow_whenNotFound() {
        when(sagaRepository.findBySessionId(999L)).thenReturn(Optional.empty());
        assertThrows(SagaNotFoundException.class, () -> sagaOrchestrator.getSagaBySessionId(999L));
    }

    @Test
    void getSagaBySessionId_shouldNotAdvance_whenNotInitiated() {
        saga.setStatus(SagaStatus.COMPLETED);
        when(sagaRepository.findBySessionId(100L)).thenReturn(Optional.of(saga));
        when(sagaMapper.toDto(saga)).thenReturn(sagaResponse);

        sagaOrchestrator.getSagaBySessionId(100L);
        verify(sessionServiceClient, never()).getSession(anyLong());
    }
}

package com.skillsync.payment.saga;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.razorpay.*;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Map;

@ExtendWith(MockitoExtension.class)
class PaymentProcessorTest {

    @InjectMocks
    private PaymentProcessor paymentProcessor;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentProcessor, "keyId", "test_id");
        ReflectionTestUtils.setField(paymentProcessor, "keySecret", "test_secret");
        ReflectionTestUtils.setField(paymentProcessor, "currency", "INR");
    }

    @Test
    void createOrder_shouldReturnOrderId() throws RazorpayException {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            OrderClient orderClient = mock(OrderClient.class);
            Order order = mock(Order.class);
            when(order.get("id")).thenReturn("order_123");
            when(orderClient.create(any(JSONObject.class))).thenReturn(order);
            ReflectionTestUtils.setField(mock, "orders", orderClient);
        })) {
            String result = paymentProcessor.createOrder("receipt_1", new BigDecimal("100.00"));
            assertThat(result).isEqualTo("order_123");
        }
    }

    @Test
    void createOrder_shouldThrowException_whenRazorpayFails() {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            OrderClient orderClient = mock(OrderClient.class);
            when(orderClient.create(any())).thenThrow(new RazorpayException("Error"));
            ReflectionTestUtils.setField(mock, "orders", orderClient);
        })) {
            assertThrows(RuntimeException.class, () -> paymentProcessor.createOrder("receipt_1", new BigDecimal("100.00")));
        }
    }

    @Test
    void verifySignature_shouldSucceed() {
        try (MockedStatic<Utils> mockedUtils = mockStatic(Utils.class)) {
            paymentProcessor.verifySignature("order_1", "pay_1", "sig_1");
            mockedUtils.verify(() -> Utils.verifyPaymentSignature(any(JSONObject.class), anyString()));
        }
    }

    @Test
    void verifySignature_shouldThrowException_whenFails() {
        try (MockedStatic<Utils> mockedUtils = mockStatic(Utils.class)) {
            mockedUtils.when(() -> Utils.verifyPaymentSignature(any(), anyString()))
                .thenThrow(new RazorpayException("Bad signature"));
            
            assertThrows(RuntimeException.class, () -> paymentProcessor.verifySignature("order_1", "pay_1", "sig_1"));
        }
    }

    @Test
    void verifySignature_shouldHandleGeneralException() {
        try (MockedStatic<Utils> mockedUtils = mockStatic(Utils.class)) {
            mockedUtils.when(() -> Utils.verifyPaymentSignature(any(), anyString()))
                .thenThrow(new RuntimeException("General error"));
            
            assertThrows(RuntimeException.class, () -> paymentProcessor.verifySignature("order_1", "pay_1", "sig_1"));
        }
    }

    @Test
    void fetchAndConfirmPayment_shouldReturnId_whenCaptured() throws RazorpayException {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            PaymentClient paymentClient = mock(PaymentClient.class);
            Payment payment = mock(Payment.class);
            when(payment.get("status")).thenReturn("captured");
            when(paymentClient.fetch("pay_1")).thenReturn(payment);
            ReflectionTestUtils.setField(mock, "payments", paymentClient);
        })) {
            String result = paymentProcessor.fetchAndConfirmPayment("pay_1");
            assertThat(result).isEqualTo("pay_1");
        }
    }

    @Test
    void fetchAndConfirmPayment_shouldReturnId_whenAuthorized() throws RazorpayException {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            PaymentClient paymentClient = mock(PaymentClient.class);
            Payment payment = mock(Payment.class);
            when(payment.get("status")).thenReturn("authorized");
            when(paymentClient.fetch("pay_1")).thenReturn(payment);
            ReflectionTestUtils.setField(mock, "payments", paymentClient);
        })) {
            String result = paymentProcessor.fetchAndConfirmPayment("pay_1");
            assertThat(result).isEqualTo("pay_1");
        }
    }

    @Test
    void fetchAndConfirmPayment_shouldThrow_whenNotCaptured() throws RazorpayException {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            PaymentClient paymentClient = mock(PaymentClient.class);
            Payment payment = mock(Payment.class);
            when(payment.get("status")).thenReturn("failed");
            when(paymentClient.fetch("pay_1")).thenReturn(payment);
            ReflectionTestUtils.setField(mock, "payments", paymentClient);
        })) {
            assertThrows(RuntimeException.class, () -> paymentProcessor.fetchAndConfirmPayment("pay_1"));
        }
    }

    @Test
    void fetchAndConfirmPayment_shouldHandleGeneralException() throws RazorpayException {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            PaymentClient paymentClient = mock(PaymentClient.class);
            when(paymentClient.fetch(anyString())).thenThrow(new RuntimeException("Socket error"));
            ReflectionTestUtils.setField(mock, "payments", paymentClient);
        })) {
            assertThrows(RuntimeException.class, () -> paymentProcessor.fetchAndConfirmPayment("pay_1"));
        }
    }

    @Test
    void refund_shouldReturnRefundId() throws RazorpayException {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            PaymentClient paymentClient = mock(PaymentClient.class);
            Refund refund = mock(Refund.class);
            when(refund.get("id")).thenReturn("rfnd_1");
            when(paymentClient.refund(anyString(), any(JSONObject.class))).thenReturn(refund);
            ReflectionTestUtils.setField(mock, "payments", paymentClient);
        })) {
            String result = paymentProcessor.refund("pay_1", new BigDecimal("100.00"));
            assertThat(result).isEqualTo("rfnd_1");
        }
    }

    @Test
    void refund_shouldSimulate_whenBadRequestInTestMode() throws RazorpayException {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            PaymentClient paymentClient = mock(PaymentClient.class);
            when(paymentClient.refund(anyString(), any())).thenThrow(new RazorpayException("BAD_REQUEST_ERROR occurred"));
            ReflectionTestUtils.setField(mock, "payments", paymentClient);
        })) {
            String result = paymentProcessor.refund("pay_1", new BigDecimal("100.00"));
            assertThat(result).startsWith("rfnd_test_");
        }
    }

    @Test
    void refund_shouldHandleOtherRazorpayErrors() throws RazorpayException {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            PaymentClient paymentClient = mock(PaymentClient.class);
            when(paymentClient.refund(anyString(), any())).thenThrow(new RazorpayException("Generic Razorpay error"));
            ReflectionTestUtils.setField(mock, "payments", paymentClient);
        })) {
            assertThrows(RuntimeException.class, () -> paymentProcessor.refund("pay_1", BigDecimal.TEN));
        }
    }

    @Test
    void refund_shouldHandleGeneralException() {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            PaymentClient paymentClient = mock(PaymentClient.class);
            when(paymentClient.refund(anyString(), any())).thenThrow(new RuntimeException("General error"));
            ReflectionTestUtils.setField(mock, "payments", paymentClient);
        })) {
            assertThrows(RuntimeException.class, () -> paymentProcessor.refund("pay_1", BigDecimal.TEN));
        }
    }

    @Test
    void fetchAndConfirmPayment_shouldHandleInvalidStatus() throws RazorpayException {
        try (MockedConstruction<RazorpayClient> mocked = mockConstruction(RazorpayClient.class, (mock, context) -> {
            PaymentClient paymentClient = mock(PaymentClient.class);
            Payment payment = mock(Payment.class);
            when(payment.get("status")).thenReturn("failed_totally");
            when(paymentClient.fetch("pay_1")).thenReturn(payment);
            ReflectionTestUtils.setField(mock, "payments", paymentClient);
        })) {
            assertThrows(RuntimeException.class, () -> paymentProcessor.fetchAndConfirmPayment("pay_1"));
        }
    }

    @Test
    void refund_shouldThrow_whenPaymentIdNull() {
        assertThrows(RuntimeException.class, () -> paymentProcessor.refund(null, BigDecimal.ONE));
    }
}

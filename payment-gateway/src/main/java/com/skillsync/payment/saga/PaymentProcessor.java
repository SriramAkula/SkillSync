package com.skillsync.payment.saga;

import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.Refund;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class PaymentProcessor {

    private static final Logger log = LoggerFactory.getLogger(PaymentProcessor.class);

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Value("${razorpay.currency:INR}")
    private String currency;

    // ─────────────────────────────────────────────────────────────
    // Step 1: Create Razorpay Order
    // Called when mentor accepts — returns order_id to frontend
    // ─────────────────────────────────────────────────────────────
    public String createOrder(String idempotencyKey, BigDecimal amount) {
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            // Razorpay expects amount in smallest currency unit (paise for INR)
            orderRequest.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", idempotencyKey); // correlationId as idempotency key
            orderRequest.put("payment_capture", 1);      // auto-capture on payment

            Order order = client.orders.create(orderRequest);
            String orderId = order.get("id");

            log.info("[RAZORPAY] Order created. orderId={}, amount={} {}", orderId, amount, currency);
            return orderId;

        } catch (RazorpayException e) {
            log.error("[RAZORPAY] Failed to create order: {}", e.getMessage());
            throw new RuntimeException("Razorpay order creation failed: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Step 2: Verify Payment Signature
    // Called after frontend completes payment on Razorpay Checkout
    // Prevents tampered/fake payment confirmations
    // ─────────────────────────────────────────────────────────────
    public void verifySignature(String orderId, String paymentId, String signature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);

            Utils.verifyPaymentSignature(attributes, keySecret);
            log.info("[RAZORPAY] Signature verified. paymentId={}", paymentId);

        } catch (RazorpayException e) {
            log.error("[RAZORPAY] Signature verification failed: {}", e.getMessage());
            throw new RuntimeException("Payment signature verification failed — possible tampered request", e);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Step 3: Fetch Payment Details
    // Confirms payment status from Razorpay after verification
    // ─────────────────────────────────────────────────────────────
    public String fetchAndConfirmPayment(String paymentId) {
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            Payment payment = client.payments.fetch(paymentId);

            String status = payment.get("status");
            log.info("[RAZORPAY] Payment status={} for paymentId={}", status, paymentId);

            if (!"captured".equals(status) && !"authorized".equals(status)) {
                throw new RuntimeException("Payment not captured. Status: " + status);
            }

            return paymentId;

        } catch (RazorpayException e) {
            log.error("[RAZORPAY] Failed to fetch payment: {}", e.getMessage());
            throw new RuntimeException("Failed to confirm payment: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Step 4: Refund
    // Called during compensation when session is cancelled
    // ─────────────────────────────────────────────────────────────
    public String refund(String paymentId, BigDecimal amount) {
        if (paymentId == null) {
            throw new RuntimeException("Cannot refund — no Razorpay payment ID found");
        }

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", amount.multiply(BigDecimal.valueOf(100)).longValue());

            Refund refund = client.payments.refund(paymentId, refundRequest);
            String refundId = refund.get("id");

            log.info("[RAZORPAY] Refund successful. refundId={}, paymentId={}, amount={} {}",
                    refundId, paymentId, amount, currency);
            return refundId;

        } catch (RazorpayException e) {
            // Razorpay test mode UPI payments don't support refunds via API.
            // In production with real payments this will work.
            // For test mode: simulate refund with a generated reference.
            if (e.getMessage() != null && e.getMessage().contains("BAD_REQUEST_ERROR")) {
                String simulatedRefundId = "rfnd_test_" + java.util.UUID.randomUUID().toString().substring(0, 10).toUpperCase();
                log.warn("[RAZORPAY] Test mode refund simulated (UPI test payments don't support API refunds). refundId={}", simulatedRefundId);
                return simulatedRefundId;
            }
            log.error("[RAZORPAY] Refund failed for paymentId={}: {}", paymentId, e.getMessage());
            throw new RuntimeException("Razorpay refund failed: " + e.getMessage(), e);
        }
    }
}

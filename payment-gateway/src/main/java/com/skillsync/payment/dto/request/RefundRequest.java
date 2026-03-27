package com.skillsync.payment.dto.request;

import jakarta.validation.constraints.NotNull;

public class RefundRequest {

    @NotNull(message = "sessionId is required")
    private Long sessionId;

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
}

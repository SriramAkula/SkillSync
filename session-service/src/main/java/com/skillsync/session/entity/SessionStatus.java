package com.skillsync.session.entity;

public enum SessionStatus {
    REQUESTED("REQUESTED"),
    ACCEPTED("ACCEPTED"),
    REJECTED("REJECTED"),
    COMPLETED("COMPLETED"),
    CANCELLED("CANCELLED"),
    CONFIRMED("CONFIRMED"),
    PAYMENT_FAILED("PAYMENT_FAILED"),
    REFUNDED("REFUNDED");
    
    private final String value;
    
    SessionStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}

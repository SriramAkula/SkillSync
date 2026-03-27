package com.skillsync.mentor.entity;

public enum MentorStatus {
    PENDING("PENDING"),
    APPROVED("APPROVED"),
    REJECTED("REJECTED"),
    SUSPENDED("SUSPENDED");
    
    private final String value;
    
    MentorStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}

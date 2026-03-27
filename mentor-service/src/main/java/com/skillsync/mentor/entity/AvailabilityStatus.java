package com.skillsync.mentor.entity;

public enum AvailabilityStatus {
    AVAILABLE("AVAILABLE"),
    BUSY("BUSY"),
    ON_LEAVE("ON_LEAVE");
    
    private final String value;
    
    AvailabilityStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}

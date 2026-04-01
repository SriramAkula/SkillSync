package com.skillsync.group.entity;

public enum MemberRole {
    CREATOR("CREATOR"),
    MODERATOR("MODERATOR"),
    MEMBER("MEMBER");
    
    private final String value;
    
    MemberRole(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}

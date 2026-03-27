package com.skillsync.notification.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String type; // SESSION_REQUESTED, SESSION_ACCEPTED, MENTOR_APPROVED, REVIEW_SUBMITTED
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @Column(columnDefinition = "JSON")
    private String data; // JSON data stored as string
    
    @Column(name = "`read`", nullable = false, columnDefinition = "BOOLEAN")
    private Boolean read = false;
    
    @Column(nullable = false)
    private LocalDateTime sentAt;
    
    public Notification() {}
    
    public Notification(Long id, Long userId, String type, String message, String data, Boolean read, LocalDateTime sentAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.message = message;
        this.data = data;
        this.read = read;
        this.sentAt = sentAt;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
    
    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }
    
    // Alias methods to support test expectations
    public Boolean getIsRead() {
        return read;
    }
    
    public void setIsRead(Boolean isRead) {
        this.read = isRead;
    }
    
    public LocalDateTime getSentAt() { return sentAt; }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
}


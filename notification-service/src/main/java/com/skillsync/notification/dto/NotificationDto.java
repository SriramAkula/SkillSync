package com.skillsync.notification.dto;

import com.skillsync.notification.entity.Notification;
import java.time.LocalDateTime;

public class NotificationDto {
    private Long id;
    private Long userId;
    private String type;
    private String message;
    private String data;
    private Boolean read;
    private LocalDateTime sentAt;
    
    public NotificationDto() {}
    
    public NotificationDto(Long id, Long userId, String type, String message, String data, Boolean read, LocalDateTime sentAt) {
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
    
    public Boolean getRead() { return read; }
    public void setRead(Boolean read) { this.read = read; }
    
    // Alias methods to support test expectations
    public Boolean getIsRead() { return read; }
    public void setIsRead(Boolean isRead) { this.read = isRead; }
    
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    
    public static NotificationDto fromEntity(Notification notification) {
        return new NotificationDto(
            notification.getId(),
            notification.getUserId(),
            notification.getType(),
            notification.getMessage(),
            notification.getData(),
            notification.getRead(),
            notification.getSentAt()
        );
    }
}

package com.skillsync.notification.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.skillsync.notification.entity.Notification;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private Long userId;
    private String type;
    private String message;
    private String data;
    private Boolean read;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Kolkata")
    private LocalDateTime createdAt;
    
    // Alias methods to support test expectations
    public Boolean getIsRead() { return read; }
    public void setIsRead(Boolean isRead) { this.read = isRead; }
    
    public static NotificationDto fromEntity(Notification notification) {
        return NotificationDto.builder()
            .id(notification.getId())
            .userId(notification.getUserId())
            .type(notification.getType())
            .message(notification.getMessage())
            .data(notification.getData())
            .read(notification.getRead())
            .createdAt(notification.getCreatedAt())
            .build();
    }
}

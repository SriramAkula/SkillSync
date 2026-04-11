package com.skillsync.notification.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    // Alias methods to support test expectations
    public Boolean getIsRead() {
        return read;
    }
    
    public void setIsRead(Boolean isRead) {
        this.read = isRead;
    }
}


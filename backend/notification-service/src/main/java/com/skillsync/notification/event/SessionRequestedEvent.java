package com.skillsync.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionRequestedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    private Long sessionId;
    private Long mentorId;
    private Long learnerId;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
}

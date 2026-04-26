package com.skillsync.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionRejectedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    private Long sessionId;
    private Long mentorId;
    private Long learnerId;
    private String rejectionReason;
}

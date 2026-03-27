package com.skillsync.notification.event;

import java.io.Serializable;
import java.time.LocalDateTime;

public class SessionRequestedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    private Long sessionId;
    private Long mentorId;
    private Long learnerId;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    
    public SessionRequestedEvent() {}
    
    public SessionRequestedEvent(Long sessionId, Long mentorId, Long learnerId, LocalDateTime scheduledAt, Integer durationMinutes) {
        this.sessionId = sessionId;
        this.mentorId = mentorId;
        this.learnerId = learnerId;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
    }
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
    
    public Long getLearnerId() { return learnerId; }
    public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
    
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
}

package com.skillsync.notification.event;

import java.io.Serializable;

public class SessionRejectedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    private Long sessionId;
    private Long mentorId;
    private Long learnerId;
    private String rejectionReason;
    
    public SessionRejectedEvent() {}
    
    public SessionRejectedEvent(Long sessionId, Long mentorId, Long learnerId, String rejectionReason) {
        this.sessionId = sessionId;
        this.mentorId = mentorId;
        this.learnerId = learnerId;
        this.rejectionReason = rejectionReason;
    }
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
    
    public Long getLearnerId() { return learnerId; }
    public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
    
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}

package com.skillsync.session.event;

public class SessionAcceptedEvent {
    private Long sessionId;
    private Long mentorId;
    private Long learnerId;
    
    public SessionAcceptedEvent() {}
    
    public SessionAcceptedEvent(Long sessionId, Long mentorId, Long learnerId) {
        this.sessionId = sessionId;
        this.mentorId = mentorId;
        this.learnerId = learnerId;
    }
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
    
    public Long getLearnerId() { return learnerId; }
    public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
}

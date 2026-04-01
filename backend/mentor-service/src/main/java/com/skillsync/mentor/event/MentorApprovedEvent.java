package com.skillsync.mentor.event;

import java.io.Serializable;

public class MentorApprovedEvent implements Serializable {

    private static final long serialVersionUID = 1L;
    private Long mentorId;
    private Long userId;
    private String mentorName;

    public MentorApprovedEvent() {}

    public MentorApprovedEvent(Long mentorId, Long userId, String mentorName) {
        this.mentorId = mentorId;
        this.userId = userId;
        this.mentorName = mentorName;
    }

    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getMentorName() { return mentorName; }
    public void setMentorName(String mentorName) { this.mentorName = mentorName; }
}

package com.skillsync.payment.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class StartSagaRequest {

    @NotNull(message = "sessionId is required")
    private Long sessionId;

    @NotNull(message = "learnerId is required")
    private Long learnerId;

    @NotNull(message = "mentorId is required")
    private Long mentorId;

    @NotNull(message = "durationMinutes is required")
    @Min(value = 15, message = "Minimum session duration is 15 minutes")
    private Integer durationMinutes;

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public Long getLearnerId() { return learnerId; }
    public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
}

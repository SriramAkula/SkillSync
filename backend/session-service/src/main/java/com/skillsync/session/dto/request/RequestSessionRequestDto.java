package com.skillsync.session.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

public class RequestSessionRequestDto {
    @NotNull(message = "Mentor ID is required")
    private Long mentorId;
    
    @NotNull(message = "Skill ID is required")
    private Long skillId;
    
    @NotNull(message = "Scheduled time is required")
    @Future(message = "Session must be scheduled in future")
    private LocalDateTime scheduledAt;
    
    @NotNull(message = "Duration is required")
    @Min(value = 15, message = "Minimum duration is 15 minutes")
    @Max(value = 240, message = "Maximum duration is 240 minutes")
    private Integer durationMinutes = 60;

    // Manual Getters and Setters
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
}

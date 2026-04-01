package com.skillsync.payment.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SessionDto {
    private boolean success;
    private SessionData data;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public SessionData getData() { return data; }
    public void setData(SessionData data) { this.data = data; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SessionData {
        private Long id;
        private Long mentorId;
        private Long learnerId;
        private Integer durationMinutes;
        private String status;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getMentorId() { return mentorId; }
        public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
        public Long getLearnerId() { return learnerId; }
        public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
        public Integer getDurationMinutes() { return durationMinutes; }
        public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}

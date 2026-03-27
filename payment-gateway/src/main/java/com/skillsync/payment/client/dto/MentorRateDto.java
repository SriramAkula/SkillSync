package com.skillsync.payment.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class MentorRateDto {
    private boolean success;
    private MentorData data;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public MentorData getData() { return data; }
    public void setData(MentorData data) { this.data = data; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MentorData {
        private Long id;
        private Long userId;
        private Double hourlyRate;
        private String specialization;
        private String status;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Double getHourlyRate() { return hourlyRate; }
        public void setHourlyRate(Double hourlyRate) { this.hourlyRate = hourlyRate; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}

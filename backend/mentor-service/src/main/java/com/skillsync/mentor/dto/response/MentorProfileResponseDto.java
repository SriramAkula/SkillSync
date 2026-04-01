package com.skillsync.mentor.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

public class MentorProfileResponseDto {
    private Long id;
    private Long userId;
    private String status;
    private Boolean isApproved;
    private Long approvedBy;
    private LocalDateTime approvalDate;
    private String specialization;
    private Integer yearsOfExperience;
    private Double hourlyRate;
    private Double rating;
    private Integer totalStudents;
    private String availabilityStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MentorProfileResponseDto() {}

    public MentorProfileResponseDto(Long id, Long userId, String status, Boolean isApproved, Long approvedBy, 
                                 LocalDateTime approvalDate, String specialization, Integer yearsOfExperience, 
                                 Double hourlyRate, Double rating, Integer totalStudents, String availabilityStatus, 
                                 LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.status = status;
        this.isApproved = isApproved;
        this.approvedBy = approvedBy;
        this.approvalDate = approvalDate;
        this.specialization = specialization;
        this.yearsOfExperience = yearsOfExperience;
        this.hourlyRate = hourlyRate;
        this.rating = rating;
        this.totalStudents = totalStudents;
        this.availabilityStatus = availabilityStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static MentorProfileResponseDtoBuilder builder() {
        return new MentorProfileResponseDtoBuilder();
    }

    public static class MentorProfileResponseDtoBuilder {
        private Long id;
        private Long userId;
        private String status;
        private Boolean isApproved;
        private Long approvedBy;
        private LocalDateTime approvalDate;
        private String specialization;
        private Integer yearsOfExperience;
        private Double hourlyRate;
        private Double rating;
        private Integer totalStudents;
        private String availabilityStatus;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public MentorProfileResponseDtoBuilder id(Long id) { this.id = id; return this; }
        public MentorProfileResponseDtoBuilder userId(Long userId) { this.userId = userId; return this; }
        public MentorProfileResponseDtoBuilder status(String status) { this.status = status; return this; }
        public MentorProfileResponseDtoBuilder isApproved(Boolean isApproved) { this.isApproved = isApproved; return this; }
        public MentorProfileResponseDtoBuilder approvedBy(Long approvedBy) { this.approvedBy = approvedBy; return this; }
        public MentorProfileResponseDtoBuilder approvalDate(LocalDateTime approvalDate) { this.approvalDate = approvalDate; return this; }
        public MentorProfileResponseDtoBuilder specialization(String specialization) { this.specialization = specialization; return this; }
        public MentorProfileResponseDtoBuilder yearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; return this; }
        public MentorProfileResponseDtoBuilder hourlyRate(Double hourlyRate) { this.hourlyRate = hourlyRate; return this; }
        public MentorProfileResponseDtoBuilder rating(Double rating) { this.rating = rating; return this; }
        public MentorProfileResponseDtoBuilder totalStudents(Integer totalStudents) { this.totalStudents = totalStudents; return this; }
        public MentorProfileResponseDtoBuilder availabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; return this; }
        public MentorProfileResponseDtoBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public MentorProfileResponseDtoBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public MentorProfileResponseDto build() {
            return new MentorProfileResponseDto(id, userId, status, isApproved, approvedBy, approvalDate, 
                specialization, yearsOfExperience, hourlyRate, rating, totalStudents, availabilityStatus, 
                createdAt, updatedAt);
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsApproved() { return isApproved; }
    public void setIsApproved(Boolean isApproved) { this.isApproved = isApproved; }
    public Long getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Long approvedBy) { this.approvedBy = approvedBy; }
    public LocalDateTime getApprovalDate() { return approvalDate; }
    public void setApprovalDate(LocalDateTime approvalDate) { this.approvalDate = approvalDate; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }
    public Double getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(Double hourlyRate) { this.hourlyRate = hourlyRate; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Integer getTotalStudents() { return totalStudents; }
    public void setTotalStudents(Integer totalStudents) { this.totalStudents = totalStudents; }
    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

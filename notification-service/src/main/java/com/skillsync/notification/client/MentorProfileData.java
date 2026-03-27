package com.skillsync.notification.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentorProfileData {
    private Long id;
    
    @JsonProperty("userId")
    private Long userId;
    
    private String status;
    private Boolean isApproved;
    private String specialization;
    private Integer yearsOfExperience;
    private Double hourlyRate;
    private Double rating;
    private Integer totalStudents;
    private String availabilityStatus;
    
    // Explicit getters for cases where Lombok doesn't process annotations
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Boolean getIsApproved() {
        return isApproved;
    }
    
    public void setIsApproved(Boolean isApproved) {
        this.isApproved = isApproved;
    }
}

package com.skillsync.notification.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response wrapper for API calls
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentorProfileResponse {
    private Boolean success;
    private MentorProfileData data;
    private String message;
    private Integer statusCode;
    
    // Getters (Lombok @Data provides these, but being explicit for clarity)
    public MentorProfileData getData() {
        return data;
    }
    
    public void setData(MentorProfileData data) {
        this.data = data;
    }
}

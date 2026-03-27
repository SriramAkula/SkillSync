package com.skillsync.mentor.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

public class UpdateAvailabilityRequestDto {
    
    @NotNull(message = "Availability status is required")
    private String availabilityStatus; // AVAILABLE, BUSY, ON_LEAVE

    // Manual Getters and Setters
    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }
}

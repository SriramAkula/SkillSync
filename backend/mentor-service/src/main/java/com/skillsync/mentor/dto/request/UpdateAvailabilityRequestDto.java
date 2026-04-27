package com.skillsync.mentor.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAvailabilityRequestDto {
    
    @NotNull(message = "Availability status is required")
    private String availabilityStatus; // AVAILABLE, BUSY, ON_LEAVE
}

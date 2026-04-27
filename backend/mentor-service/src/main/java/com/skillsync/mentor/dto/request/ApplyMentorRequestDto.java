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
public class ApplyMentorRequestDto {

    @NotBlank(message = "Specialization is required")
    @Size(min = 3, max = 100, message = "Specialization must be between 3 and 100 characters")
    private String specialization;

    @NotNull(message = "Years of experience is required")
    @Min(value = 0, message = "Years of experience cannot be negative")
    @Max(value = 60, message = "Years of experience cannot exceed 60")
    private Integer yearsOfExperience;

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "5.0", message = "Hourly rate must be at least 5")
    @DecimalMax(value = "500.0", message = "Hourly rate cannot exceed 500")
    private Double hourlyRate;

    @NotBlank(message = "Bio is required")
    @Size(min = 10, max = 500, message = "Bio must be between 10 and 500 characters")
    private String bio;
}

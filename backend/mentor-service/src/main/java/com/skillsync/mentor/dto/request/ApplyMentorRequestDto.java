package com.skillsync.mentor.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

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

    // Manual Getters and Setters
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }
    public Double getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(Double hourlyRate) { this.hourlyRate = hourlyRate; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}

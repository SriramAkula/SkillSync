package com.skillsync.mentor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}

package com.skillsync.mentor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Kolkata")
    private LocalDateTime approvalDate;
    private String specialization;
    private Integer yearsOfExperience;
    private Double hourlyRate;
    private Double rating;
    private Integer totalStudents;
    private String availabilityStatus;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Kolkata")
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Kolkata")
    private LocalDateTime updatedAt;
}

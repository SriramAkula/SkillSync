package com.skillsync.review.dto.request;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitReviewRequestDto {
    
    @NotNull(message = "Mentor ID is required")
    private Long mentorId;
    
    @NotNull(message = "Session ID is required")
    private Long sessionId;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer rating;
    
    @Size(max = 500, message = "Comment cannot exceed 500 characters")
    private String comment;
    
    @NotNull(message = "isAnonymous flag is required")
    private Boolean isAnonymous = false;
}

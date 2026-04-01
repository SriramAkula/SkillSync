package com.skillsync.review.dto.request;

import jakarta.validation.constraints.*;

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
    
    public SubmitReviewRequestDto() {}
    
    public SubmitReviewRequestDto(Long mentorId, Long sessionId, Integer rating, String comment, Boolean isAnonymous) {
        this.mentorId = mentorId;
        this.sessionId = sessionId;
        this.rating = rating;
        this.comment = comment;
        this.isAnonymous = isAnonymous;
    }
    
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    
    public Boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(Boolean isAnonymous) { this.isAnonymous = isAnonymous; }
}

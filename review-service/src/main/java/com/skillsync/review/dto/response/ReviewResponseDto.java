package com.skillsync.review.dto.response;

import java.time.LocalDateTime;

public class ReviewResponseDto {
    private Long id;
    private Long mentorId;
    private Long learnerId;
    private Long sessionId;
    private Integer rating;
    private String comment;
    private Boolean isAnonymous;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public ReviewResponseDto() {}
    
    public ReviewResponseDto(Long id, Long mentorId, Long learnerId, Long sessionId, Integer rating,
                             String comment, Boolean isAnonymous, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.mentorId = mentorId;
        this.learnerId = learnerId;
        this.sessionId = sessionId;
        this.rating = rating;
        this.comment = comment;
        this.isAnonymous = isAnonymous;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
    
    public Long getLearnerId() { return learnerId; }
    public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    
    public Boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(Boolean isAnonymous) { this.isAnonymous = isAnonymous; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public static ReviewResponseDtoBuilder builder() {
        return new ReviewResponseDtoBuilder();
    }
    
    public static class ReviewResponseDtoBuilder {
        private Long id;
        private Long mentorId;
        private Long learnerId;
        private Long sessionId;
        private Integer rating;
        private String comment;
        private Boolean isAnonymous;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        
        public ReviewResponseDtoBuilder id(Long id) { this.id = id; return this; }
        public ReviewResponseDtoBuilder mentorId(Long mentorId) { this.mentorId = mentorId; return this; }
        public ReviewResponseDtoBuilder learnerId(Long learnerId) { this.learnerId = learnerId; return this; }
        public ReviewResponseDtoBuilder sessionId(Long sessionId) { this.sessionId = sessionId; return this; }
        public ReviewResponseDtoBuilder rating(Integer rating) { this.rating = rating; return this; }
        public ReviewResponseDtoBuilder comment(String comment) { this.comment = comment; return this; }
        public ReviewResponseDtoBuilder isAnonymous(Boolean isAnonymous) { this.isAnonymous = isAnonymous; return this; }
        public ReviewResponseDtoBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ReviewResponseDtoBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        
        public ReviewResponseDto build() {
            return new ReviewResponseDto(this.id, this.mentorId, this.learnerId, this.sessionId, 
                                         this.rating, this.comment, this.isAnonymous, this.createdAt, this.updatedAt);
        }
    }
}

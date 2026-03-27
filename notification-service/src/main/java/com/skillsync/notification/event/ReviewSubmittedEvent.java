package com.skillsync.notification.event;

import java.io.Serializable;

public class ReviewSubmittedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    private Long reviewId;
    private Long mentorId;
    private Long learnerId;
    private Integer rating;
    private String comment;
    
    public ReviewSubmittedEvent() {}
    
    public ReviewSubmittedEvent(Long reviewId, Long mentorId, Long learnerId, Integer rating, String comment) {
        this.reviewId = reviewId;
        this.mentorId = mentorId;
        this.learnerId = learnerId;
        this.rating = rating;
        this.comment = comment;
    }
    
    public Long getReviewId() { return reviewId; }
    public void setReviewId(Long reviewId) { this.reviewId = reviewId; }
    
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
    
    public Long getLearnerId() { return learnerId; }
    public void setLearnerId(Long learnerId) { this.learnerId = learnerId; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}

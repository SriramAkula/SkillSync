package com.skillsync.review.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.skillsync.review.audit.Auditable;

@Entity
@Table(name = "reviews")
public class Review extends Auditable {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long mentorId;
    
    @Column(nullable = false)
    private Long learnerId;
    
    @Column(nullable = false)
    private Long sessionId;
    
    @Column(nullable = false)
    private Integer rating; // 1-5
    
    @Column(columnDefinition = "TEXT")
    private String comment;
    
    @Column(nullable = false)
    private Boolean isAnonymous = false;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    public Review() {}
    
    public Review(Long id, Long mentorId, Long learnerId, Long sessionId, Integer rating, 
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
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

package com.skillsync.review.repository;

import com.skillsync.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    @Query("SELECT r FROM Review r WHERE r.mentorId = :mentorId ORDER BY r.createdAt DESC")
    List<Review> findByMentorId(Long mentorId);
    
    @Query("SELECT r FROM Review r WHERE r.learnerId = :learnerId ORDER BY r.createdAt DESC")
    List<Review> findByLearnerId(Long learnerId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.mentorId = :mentorId")
    Double getAverageRating(Long mentorId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.mentorId = :mentorId")
    Integer getTotalReviewCount(Long mentorId);
}

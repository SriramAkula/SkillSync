package com.skillsync.review.repository;

import com.skillsync.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("SELECT r FROM Review r WHERE r.mentorId = :mentorId")
    org.springframework.data.domain.Page<Review> findByMentorId(Long mentorId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.learnerId = :learnerId")
    org.springframework.data.domain.Page<Review> findByLearnerId(Long learnerId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.mentorId = :mentorId")
    Double getAverageRating(Long mentorId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.mentorId = :mentorId")
    Integer getTotalReviewCount(Long mentorId);

    @Query("SELECT COUNT(DISTINCT r.learnerId) FROM Review r WHERE r.mentorId = :mentorId")
    Integer getTotalLearnerCount(Long mentorId);
}

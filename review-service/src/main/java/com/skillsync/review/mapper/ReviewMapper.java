package com.skillsync.review.mapper;

import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.entity.Review;
import org.springframework.stereotype.Component;

@Component
public class ReviewMapper {

    // SubmitReviewRequestDto + learnerId -> Review entity
    public Review toEntity(Long learnerId, SubmitReviewRequestDto request) {
        Review review = new Review();
        review.setLearnerId(learnerId);
        review.setMentorId(request.getMentorId());
        review.setSessionId(request.getSessionId());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false);
        return review;
    }

    // Apply update fields onto existing review entity
    public void updateEntity(Review review, SubmitReviewRequestDto request) {
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false);
    }

    // Review entity -> ReviewResponseDto
    public ReviewResponseDto toDto(Review review) {
        return ReviewResponseDto.builder()
                .id(review.getId())
                .mentorId(review.getMentorId())
                .learnerId(review.getLearnerId())
                .sessionId(review.getSessionId())
                .rating(review.getRating())
                .comment(review.getComment())
                .isAnonymous(review.getIsAnonymous())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    // avgRating + totalReviews -> MentorRatingDto
    public MentorRatingDto toRatingDto(Long mentorId, Double avgRating, Integer totalReviews) {
        return MentorRatingDto.builder()
                .mentorId(mentorId)
                .averageRating(avgRating != null ? avgRating : 0.0)
                .totalReviews(totalReviews != null ? totalReviews : 0)
                .build();
    }
}

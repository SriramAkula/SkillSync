package com.skillsync.review.mapper;

import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.entity.Review;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReviewMapperTest {

    private final ReviewMapper reviewMapper = new ReviewMapper();

    @Test
    void toEntity_shouldMapCorrectly() {
        SubmitReviewRequestDto request = new SubmitReviewRequestDto();
        request.setMentorId(5L);
        request.setRating(4);
        request.setComment("Good");
        request.setIsAnonymous(true);

        Review result = reviewMapper.toEntity(10L, request);

        assertThat(result.getLearnerId()).isEqualTo(10L);
        assertThat(result.getMentorId()).isEqualTo(5L);
        assertThat(result.getRating()).isEqualTo(4);
        assertThat(result.getIsAnonymous()).isTrue();
    }

    @Test
    void toEntity_shouldFallbackToNotAnonymous() {
        SubmitReviewRequestDto request = new SubmitReviewRequestDto();
        request.setIsAnonymous(null);

        Review result = reviewMapper.toEntity(10L, request);

        assertThat(result.getIsAnonymous()).isFalse();
    }

    @Test
    void toDto_shouldMapAllFields() {
        Review review = new Review();
        review.setId(1L);
        review.setMentorId(5L);
        review.setRating(5);

        ReviewResponseDto result = reviewMapper.toDto(review);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getRating()).isEqualTo(5);
    }

    @Test
    void toRatingDto_shouldHandleNulls() {
        MentorRatingDto result = reviewMapper.toRatingDto(5L, null, null, null);

        assertThat(result.getAverageRating()).isEqualTo(0.0);
        assertThat(result.getTotalReviews()).isEqualTo(0);
        assertThat(result.getTotalLearners()).isEqualTo(0);
    }

    @Test
    void toRatingDto_shouldHandleNonNulls() {
        MentorRatingDto result = reviewMapper.toRatingDto(5L, 4.5, 10, 8);

        assertThat(result.getAverageRating()).isEqualTo(4.5);
        assertThat(result.getTotalReviews()).isEqualTo(10);
        assertThat(result.getTotalLearners()).isEqualTo(8);
    }

    @Test
    void updateEntity_shouldHandleAnonymousNull() {
        Review review = new Review();
        SubmitReviewRequestDto request = new SubmitReviewRequestDto();
        request.setIsAnonymous(null);
        reviewMapper.updateEntity(review, request);
        assertThat(review.getIsAnonymous()).isFalse();
    }

    @Test
    void updateEntity_shouldHandleAnonymousTrue() {
        Review review = new Review();
        SubmitReviewRequestDto request = new SubmitReviewRequestDto();
        request.setIsAnonymous(true);
        reviewMapper.updateEntity(review, request);
        assertThat(review.getIsAnonymous()).isTrue();
    }
}

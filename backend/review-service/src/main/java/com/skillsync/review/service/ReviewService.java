package com.skillsync.review.service;

import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.PageResponse;
import com.skillsync.review.dto.response.ReviewResponseDto;
import java.util.List;

public interface ReviewService {
    ReviewResponseDto submitReview(Long learnerId, SubmitReviewRequestDto request);
    ReviewResponseDto getReview(Long reviewId);
    PageResponse<ReviewResponseDto> getMentorReviews(Long mentorId, int page, int size);
    PageResponse<ReviewResponseDto> getLearnerReviews(Long learnerId, int page, int size);
    MentorRatingDto getMentorRating(Long mentorId);
    ReviewResponseDto updateReview(Long reviewId, Long learnerId, SubmitReviewRequestDto request);
    void deleteReview(Long reviewId, Long learnerId);
}

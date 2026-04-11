package com.skillsync.review.service.impl;

import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.service.ReviewService;
import com.skillsync.review.service.command.ReviewCommandService;
import com.skillsync.review.service.query.ReviewQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewCommandService reviewCommandService;
    private final ReviewQueryService reviewQueryService;

    @Override
    public ReviewResponseDto submitReview(Long learnerId, SubmitReviewRequestDto request) {
        return reviewCommandService.submitReview(learnerId, request);
    }

    @Override
    public ReviewResponseDto updateReview(Long reviewId, Long learnerId, SubmitReviewRequestDto request) {
        return reviewCommandService.updateReview(reviewId, learnerId, request);
    }

    @Override
    public void deleteReview(Long reviewId, Long learnerId) {
        reviewCommandService.deleteReview(reviewId, learnerId);
    }

    @Override
    public ReviewResponseDto getReview(Long reviewId) {
        return reviewQueryService.getReview(reviewId);
    }

    @Override
    public com.skillsync.review.dto.response.PageResponse<ReviewResponseDto> getMentorReviews(Long mentorId, int page, int size) {
        return reviewQueryService.getMentorReviews(mentorId, page, size);
    }

    @Override
    public com.skillsync.review.dto.response.PageResponse<ReviewResponseDto> getLearnerReviews(Long learnerId, int page, int size) {
        return reviewQueryService.getLearnerReviews(learnerId, page, size);
    }

    @Override
    public MentorRatingDto getMentorRating(Long mentorId) {
        return reviewQueryService.getMentorRating(mentorId);
    }
}

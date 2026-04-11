package com.skillsync.review.service.command;

import com.skillsync.review.client.MentorServiceClient;
import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.entity.Review;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.exception.UnauthorizedException;
import com.skillsync.review.mapper.ReviewMapper;
import com.skillsync.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewCommandService {

    private final ReviewRepository reviewRepository;
    private final MentorServiceClient mentorServiceClient;
    private final ReviewMapper reviewMapper;

    @Transactional
    @CacheEvict(value = "review", allEntries = true)
    public ReviewResponseDto submitReview(Long learnerId, SubmitReviewRequestDto request) {
        log.info("Submitting review: learnerId={}, mentorId={}, sessionId={}",
                learnerId, request.getMentorId(), request.getSessionId());
        Review saved = reviewRepository.save(reviewMapper.toEntity(learnerId, request));
        syncMentorRating(request.getMentorId());
        return reviewMapper.toDto(saved);
    }

    @Transactional
    @CacheEvict(value = "review", allEntries = true)
    public ReviewResponseDto updateReview(Long reviewId, Long learnerId, SubmitReviewRequestDto request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found"));
        if (!review.getLearnerId().equals(learnerId)) {
            throw new UnauthorizedException("You are not authorized to update this review");
        }
        reviewMapper.updateEntity(review, request);
        Review updated = reviewRepository.save(review);
        syncMentorRating(review.getMentorId());
        return reviewMapper.toDto(updated);
    }

    @Transactional
    @CacheEvict(value = "review", allEntries = true)
    public void deleteReview(Long reviewId, Long learnerId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found"));
        if (!review.getLearnerId().equals(learnerId)) {
            throw new UnauthorizedException("You are not authorized to delete this review");
        }
        reviewRepository.delete(review);
        syncMentorRating(review.getMentorId());
    }

    private void syncMentorRating(Long mentorId) {
        try {
            Double avgRating = reviewRepository.getAverageRating(mentorId);
            if (avgRating != null) {
                mentorServiceClient.updateMentorRating(mentorId, avgRating);
                log.info("Successfully synced rating for mentorId={}: {}", mentorId, avgRating);
            }
        } catch (Exception e) {
            log.error("Failed to sync rating for mentorId={}: {}", mentorId, e.getMessage());
        }
    }
}

package com.skillsync.review.service.impl;

import com.skillsync.review.client.MentorServiceClient;
import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.entity.Review;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.exception.UnauthorizedException;
import com.skillsync.review.repository.ReviewRepository;
import com.skillsync.review.service.ReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@CacheConfig(cacheNames = "review")
public class ReviewServiceImpl implements ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewServiceImpl.class);
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private MentorServiceClient mentorServiceClient;

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public ReviewResponseDto submitReview(Long learnerId, SubmitReviewRequestDto request) {
        log.info("Submitting review: learnerId={}, mentorId={}, sessionId={}", 
            learnerId, request.getMentorId(), request.getSessionId());

        Review review = new Review();
        review.setLearnerId(learnerId);
        review.setMentorId(request.getMentorId());
        review.setSessionId(request.getSessionId());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setIsAnonymous(request.getIsAnonymous());

        Review savedReview = reviewRepository.save(review);
        
        // Sync rating to Mentor Service
        updateMentorRatingInMentorService(request.getMentorId());

        return mapToResponseDto(savedReview);
    }

    @Override
    @Cacheable(key = "#reviewId")
    public ReviewResponseDto getReview(Long reviewId) {
        log.info("Cache MISS — fetching reviewId={} from DB", reviewId);
        return reviewRepository.findById(reviewId)
                .map(this::mapToResponseDto)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found for ID: " + reviewId));
    }

    @Override
    @Cacheable(key = "'mentor_' + #mentorId")
    public List<ReviewResponseDto> getMentorReviews(Long mentorId) {
        log.info("Cache MISS — fetching reviews for mentorId={} from DB", mentorId);
        return reviewRepository.findByMentorId(mentorId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(key = "'learner_' + #learnerId")
    public List<ReviewResponseDto> getLearnerReviews(Long learnerId) {
        log.info("Cache MISS — fetching reviews for learnerId={} from DB", learnerId);
        return reviewRepository.findByLearnerId(learnerId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(key = "'rating_' + #mentorId")
    public MentorRatingDto getMentorRating(Long mentorId) {
        log.info("Cache MISS — fetching rating for mentorId={} from DB", mentorId);
        Double avgRating = reviewRepository.getAverageRating(mentorId);
        Integer totalReviews = reviewRepository.getTotalReviewCount(mentorId);
        
        return MentorRatingDto.builder()
                .mentorId(mentorId)
                .averageRating(avgRating != null ? avgRating : 0.0)
                .totalReviews(totalReviews != null ? totalReviews : 0)
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public ReviewResponseDto updateReview(Long reviewId, Long learnerId, SubmitReviewRequestDto request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found"));

        if (!review.getLearnerId().equals(learnerId)) {
            throw new UnauthorizedException("You are not authorized to update this review");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setIsAnonymous(request.getIsAnonymous());

        Review updatedReview = reviewRepository.save(review);
        
        // Sync updated rating
        updateMentorRatingInMentorService(review.getMentorId());

        return mapToResponseDto(updatedReview);
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public void deleteReview(Long reviewId, Long learnerId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found"));

        if (!review.getLearnerId().equals(learnerId)) {
            throw new UnauthorizedException("You are not authorized to delete this review");
        }

        reviewRepository.delete(review);
        
        // Sync rating after deletion
        updateMentorRatingInMentorService(review.getMentorId());
    }

    private void updateMentorRatingInMentorService(Long mentorId) {
        try {
            Double avgRating = reviewRepository.getAverageRating(mentorId);
            if (avgRating != null) {
                mentorServiceClient.updateMentorRating(mentorId, avgRating);
                log.info("Successfully synced rating for mentorId={}: {}", mentorId, avgRating);
            }
        } catch (Exception e) {
            log.error("Failed to sync rating for mentorId={}: {}", mentorId, e.getMessage());
            // In a production app, we might use a retry mechanism or a message queue here
        }
    }

    private ReviewResponseDto mapToResponseDto(Review review) {
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
}

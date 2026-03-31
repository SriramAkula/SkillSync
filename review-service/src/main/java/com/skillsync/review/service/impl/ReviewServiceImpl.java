package com.skillsync.review.service.impl;

import com.skillsync.review.client.MentorServiceClient;
import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.entity.Review;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.exception.UnauthorizedException;
import com.skillsync.review.mapper.ReviewMapper;
import com.skillsync.review.repository.ReviewRepository;
import com.skillsync.review.service.ReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private final ReviewRepository reviewRepository;
    private final MentorServiceClient mentorServiceClient;
    private final ReviewMapper reviewMapper;

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             MentorServiceClient mentorServiceClient,
                             ReviewMapper reviewMapper) {
        this.reviewRepository = reviewRepository;
        this.mentorServiceClient = mentorServiceClient;
        this.reviewMapper = reviewMapper;
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public ReviewResponseDto submitReview(Long learnerId, SubmitReviewRequestDto request) {
        log.info("Submitting review: learnerId={}, mentorId={}, sessionId={}",
                learnerId, request.getMentorId(), request.getSessionId());
        Review review = reviewMapper.toEntity(learnerId, request);
        Review saved = reviewRepository.save(review);
        updateMentorRatingInMentorService(request.getMentorId());
        return reviewMapper.toDto(saved);
    }

    @Override
    @Cacheable(key = "#reviewId")
    public ReviewResponseDto getReview(Long reviewId) {
        log.info("Cache MISS - fetching reviewId={} from DB", reviewId);
        return reviewRepository.findById(reviewId)
                .map(reviewMapper::toDto)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found for ID: " + reviewId));
    }

    @Override
    @Cacheable(key = "'mentor_' + #mentorId")
    public List<ReviewResponseDto> getMentorReviews(Long mentorId) {
        log.info("Cache MISS - fetching reviews for mentorId={} from DB", mentorId);
        return reviewRepository.findByMentorId(mentorId).stream()
                .map(reviewMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(key = "'learner_' + #learnerId")
    public List<ReviewResponseDto> getLearnerReviews(Long learnerId) {
        log.info("Cache MISS - fetching reviews for learnerId={} from DB", learnerId);
        return reviewRepository.findByLearnerId(learnerId).stream()
                .map(reviewMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(key = "'rating_' + #mentorId")
    public MentorRatingDto getMentorRating(Long mentorId) {
        log.info("Cache MISS - fetching rating for mentorId={} from DB", mentorId);
        Double avgRating = reviewRepository.getAverageRating(mentorId);
        Integer totalReviews = reviewRepository.getTotalReviewCount(mentorId);
        return reviewMapper.toRatingDto(mentorId, avgRating, totalReviews);
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
        reviewMapper.updateEntity(review, request);
        Review updated = reviewRepository.save(review);
        updateMentorRatingInMentorService(review.getMentorId());
        return reviewMapper.toDto(updated);
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
        }
    }
}

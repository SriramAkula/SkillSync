package com.skillsync.review.service.query;

import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.mapper.ReviewMapper;
import com.skillsync.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewQueryService {

    private final ReviewRepository reviewRepository;
    private final ReviewMapper reviewMapper;

    @Cacheable(value = "review", key = "#reviewId")
    public ReviewResponseDto getReview(Long reviewId) {
        log.info("Cache MISS - fetching reviewId={} from DB", reviewId);
        return reviewRepository.findById(reviewId)
                .map(reviewMapper::toDto)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found for ID: " + reviewId));
    }

    @Cacheable(value = "review", key = "'mentor_' + #mentorId")
    public List<ReviewResponseDto> getMentorReviews(Long mentorId) {
        log.info("Cache MISS - fetching reviews for mentorId={} from DB", mentorId);
        return reviewRepository.findByMentorId(mentorId).stream()
                .map(reviewMapper::toDto).collect(Collectors.toList());
    }

    @Cacheable(value = "review", key = "'learner_' + #learnerId")
    public List<ReviewResponseDto> getLearnerReviews(Long learnerId) {
        log.info("Cache MISS - fetching reviews for learnerId={} from DB", learnerId);
        return reviewRepository.findByLearnerId(learnerId).stream()
                .map(reviewMapper::toDto).collect(Collectors.toList());
    }

    @Cacheable(value = "review", key = "'rating_' + #mentorId")
    public MentorRatingDto getMentorRating(Long mentorId) {
        log.info("Cache MISS - fetching rating for mentorId={} from DB", mentorId);
        return reviewMapper.toRatingDto(
                mentorId,
                reviewRepository.getAverageRating(mentorId),
                reviewRepository.getTotalReviewCount(mentorId),
                reviewRepository.getTotalLearnerCount(mentorId));
    }
}

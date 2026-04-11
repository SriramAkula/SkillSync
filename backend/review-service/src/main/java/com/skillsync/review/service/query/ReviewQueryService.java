package com.skillsync.review.service.query;

import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.PageResponse;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.mapper.ReviewMapper;
import com.skillsync.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

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
                .orElseThrow(() -> new com.skillsync.review.exception.ReviewNotFoundException("Review not found for ID: " + reviewId));
    }

    public com.skillsync.review.dto.response.PageResponse<ReviewResponseDto> getMentorReviews(Long mentorId, int page, int size) {
        log.info("Fetching paginated reviews for mentorId={}, page={}, size={}", mentorId, page, size);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<com.skillsync.review.entity.Review> reviewPage = reviewRepository.findByMentorId(mentorId, pageable);
        
        return com.skillsync.review.dto.response.PageResponse.<ReviewResponseDto>builder()
                .content(reviewPage.getContent().stream().map(reviewMapper::toDto).collect(java.util.stream.Collectors.toList()))
                .currentPage(reviewPage.getNumber())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .pageSize(reviewPage.getSize())
                .build();
    }

    public com.skillsync.review.dto.response.PageResponse<ReviewResponseDto> getLearnerReviews(Long learnerId, int page, int size) {
        log.info("Fetching paginated reviews for learnerId={}, page={}, size={}", learnerId, page, size);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<com.skillsync.review.entity.Review> reviewPage = reviewRepository.findByLearnerId(learnerId, pageable);
        
        return com.skillsync.review.dto.response.PageResponse.<ReviewResponseDto>builder()
                .content(reviewPage.getContent().stream().map(reviewMapper::toDto).collect(java.util.stream.Collectors.toList()))
                .currentPage(reviewPage.getNumber())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .pageSize(reviewPage.getSize())
                .build();
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

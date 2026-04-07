package com.skillsync.review.service;

import com.skillsync.review.client.MentorServiceClient;
import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.entity.Review;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.exception.UnauthorizedException;
import com.skillsync.review.mapper.ReviewMapper;
import com.skillsync.review.repository.ReviewRepository;
import com.skillsync.review.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private MentorServiceClient mentorServiceClient;
    @Mock private ReviewMapper reviewMapper;

    @InjectMocks private ReviewServiceImpl reviewService;

    private Review review;
    private ReviewResponseDto reviewResponse;
    private SubmitReviewRequestDto submitRequest;

    @BeforeEach
    void setUp() {
        review = new Review();
        review.setId(1L);
        review.setMentorId(5L);
        review.setLearnerId(10L);
        review.setSessionId(20L);
        review.setRating(4);
        review.setComment("Great session");
        review.setIsAnonymous(false);

        reviewResponse = ReviewResponseDto.builder()
                .id(1L).mentorId(5L).learnerId(10L).sessionId(20L)
                .rating(4).comment("Great session").isAnonymous(false)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        submitRequest = new SubmitReviewRequestDto();
        submitRequest.setMentorId(5L);
        submitRequest.setSessionId(20L);
        submitRequest.setRating(4);
        submitRequest.setComment("Great session");
        submitRequest.setIsAnonymous(false);
    }

    // ─── submitReview ────────────────────────────────────────────────────────

    @Test
    void submitReview_shouldReturnReview_whenValid() {
        when(reviewMapper.toEntity(10L, submitRequest)).thenReturn(review);
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewMapper.toDto(review)).thenReturn(reviewResponse);

        ReviewResponseDto result = reviewService.submitReview(10L, submitRequest);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getRating()).isEqualTo(4);
        assertThat(result.getLearnerId()).isEqualTo(10L);
        verify(reviewRepository).save(review);
    }

    // ─── getReview ───────────────────────────────────────────────────────────

    @Test
    void getReview_shouldReturnReview_whenExists() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewMapper.toDto(review)).thenReturn(reviewResponse);

        ReviewResponseDto result = reviewService.getReview(1L);

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getReview_shouldThrow_whenNotFound() {
        when(reviewRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.getReview(99L))
                .isInstanceOf(ReviewNotFoundException.class);
    }

    // ─── getMentorReviews ────────────────────────────────────────────────────

    @Test
    void getMentorReviews_shouldReturnList_whenReviewsExist() {
        when(reviewRepository.findByMentorId(5L)).thenReturn(List.of(review));
        when(reviewMapper.toDto(review)).thenReturn(reviewResponse);

        List<ReviewResponseDto> result = reviewService.getMentorReviews(5L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getMentorId()).isEqualTo(5L);
    }

    @Test
    void getMentorReviews_shouldReturnEmpty_whenNoReviews() {
        when(reviewRepository.findByMentorId(99L)).thenReturn(List.of());

        assertThat(reviewService.getMentorReviews(99L)).isEmpty();
    }

    // ─── getLearnerReviews ───────────────────────────────────────────────────

    @Test
    void getLearnerReviews_shouldReturnList_whenReviewsExist() {
        when(reviewRepository.findByLearnerId(10L)).thenReturn(List.of(review));
        when(reviewMapper.toDto(review)).thenReturn(reviewResponse);

        List<ReviewResponseDto> result = reviewService.getLearnerReviews(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLearnerId()).isEqualTo(10L);
    }

    @Test
    void getLearnerReviews_shouldReturnEmpty_whenNoReviews() {
        when(reviewRepository.findByLearnerId(99L)).thenReturn(List.of());

        assertThat(reviewService.getLearnerReviews(99L)).isEmpty();
    }

    // ─── getMentorRating ─────────────────────────────────────────────────────

    @Test
    void getMentorRating_shouldReturnRating_whenReviewsExist() {
        MentorRatingDto ratingDto = MentorRatingDto.builder()
                .mentorId(5L).averageRating(4.2).totalReviews(10).totalLearners(3).build();
        when(reviewRepository.getAverageRating(5L)).thenReturn(4.2);
        when(reviewRepository.getTotalReviewCount(5L)).thenReturn(10);
        when(reviewRepository.getTotalLearnerCount(5L)).thenReturn(3);
        when(reviewMapper.toRatingDto(5L, 4.2, 10, 3)).thenReturn(ratingDto);

        MentorRatingDto result = reviewService.getMentorRating(5L);

        assertThat(result.getAverageRating()).isEqualTo(4.2);
        assertThat(result.getTotalReviews()).isEqualTo(10);
    }

    @Test
    void getMentorRating_shouldReturnZero_whenNoReviews() {
        MentorRatingDto ratingDto = MentorRatingDto.builder()
                .mentorId(5L).averageRating(0.0).totalReviews(0).totalLearners(0).build();
        when(reviewRepository.getAverageRating(5L)).thenReturn(null);
        when(reviewRepository.getTotalReviewCount(5L)).thenReturn(0);
        when(reviewRepository.getTotalLearnerCount(5L)).thenReturn(0);
        when(reviewMapper.toRatingDto(5L, null, 0, 0)).thenReturn(ratingDto);

        MentorRatingDto result = reviewService.getMentorRating(5L);

        assertThat(result.getAverageRating()).isEqualTo(0.0);
    }

    // ─── updateReview ────────────────────────────────────────────────────────

    @Test
    void updateReview_shouldReturnUpdated_whenOwner() {
        ReviewResponseDto updated = ReviewResponseDto.builder()
                .id(1L).mentorId(5L).learnerId(10L).sessionId(20L)
                .rating(5).comment("Updated").isAnonymous(false)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewMapper.toDto(review)).thenReturn(updated);

        ReviewResponseDto result = reviewService.updateReview(1L, 10L, submitRequest);

        assertThat(result.getRating()).isEqualTo(5);
        verify(reviewMapper).updateEntity(review, submitRequest);
    }

    @Test
    void updateReview_shouldThrow_whenNotOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        assertThatThrownBy(() -> reviewService.updateReview(1L, 99L, submitRequest))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void updateReview_shouldThrow_whenReviewNotFound() {
        when(reviewRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.updateReview(99L, 10L, submitRequest))
                .isInstanceOf(ReviewNotFoundException.class);
    }

    // ─── deleteReview ────────────────────────────────────────────────────────

    @Test
    void deleteReview_shouldDelete_whenOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        reviewService.deleteReview(1L, 10L);

        verify(reviewRepository).delete(review);
    }

    @Test
    void deleteReview_shouldThrow_whenNotOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        assertThatThrownBy(() -> reviewService.deleteReview(1L, 99L))
                .isInstanceOf(UnauthorizedException.class);

        verify(reviewRepository, never()).delete(any());
    }

    @Test
    void deleteReview_shouldThrow_whenNotFound() {
        when(reviewRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.deleteReview(99L, 10L))
                .isInstanceOf(ReviewNotFoundException.class);
    }
}

package com.skillsync.review.service;

import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private ReviewService reviewService;

    private ReviewResponseDto reviewResponse;
    private SubmitReviewRequestDto submitRequest;

    @BeforeEach
    void setUp() {
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
        when(reviewService.submitReview(10L, submitRequest)).thenReturn(reviewResponse);

        ReviewResponseDto result = reviewService.submitReview(10L, submitRequest);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getRating()).isEqualTo(4);
        assertThat(result.getLearnerId()).isEqualTo(10L);
    }

    @Test
    void submitReview_shouldThrow_whenSessionNotFound() {
        when(reviewService.submitReview(eq(10L), any()))
                .thenThrow(new ReviewNotFoundException("Session not found"));

        assertThatThrownBy(() -> reviewService.submitReview(10L, submitRequest))
                .isInstanceOf(ReviewNotFoundException.class);
    }

    // ─── getReview ───────────────────────────────────────────────────────────

    @Test
    void getReview_shouldReturnReview_whenExists() {
        when(reviewService.getReview(1L)).thenReturn(reviewResponse);

        ReviewResponseDto result = reviewService.getReview(1L);

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getReview_shouldThrow_whenNotFound() {
        when(reviewService.getReview(99L)).thenThrow(new ReviewNotFoundException("Not found"));

        assertThatThrownBy(() -> reviewService.getReview(99L))
                .isInstanceOf(ReviewNotFoundException.class);
    }

    // ─── getMentorReviews ────────────────────────────────────────────────────

    @Test
    void getMentorReviews_shouldReturnList_whenReviewsExist() {
        when(reviewService.getMentorReviews(5L)).thenReturn(List.of(reviewResponse));

        List<ReviewResponseDto> result = reviewService.getMentorReviews(5L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getMentorId()).isEqualTo(5L);
    }

    @Test
    void getMentorReviews_shouldReturnEmpty_whenNoReviews() {
        when(reviewService.getMentorReviews(99L)).thenReturn(List.of());

        List<ReviewResponseDto> result = reviewService.getMentorReviews(99L);

        assertThat(result).isEmpty();
    }

    // ─── getLearnerReviews ───────────────────────────────────────────────────

    @Test
    void getLearnerReviews_shouldReturnList_whenReviewsExist() {
        when(reviewService.getLearnerReviews(10L)).thenReturn(List.of(reviewResponse));

        List<ReviewResponseDto> result = reviewService.getLearnerReviews(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLearnerId()).isEqualTo(10L);
    }

    @Test
    void getLearnerReviews_shouldReturnEmpty_whenNoReviews() {
        when(reviewService.getLearnerReviews(99L)).thenReturn(List.of());

        assertThat(reviewService.getLearnerReviews(99L)).isEmpty();
    }

    // ─── getMentorRating ─────────────────────────────────────────────────────

    @Test
    void getMentorRating_shouldReturnRating_whenReviewsExist() {
        MentorRatingDto ratingDto = MentorRatingDto.builder()
                .mentorId(5L).averageRating(4.2).totalReviews(10).build();
        when(reviewService.getMentorRating(5L)).thenReturn(ratingDto);

        MentorRatingDto result = reviewService.getMentorRating(5L);

        assertThat(result.getAverageRating()).isEqualTo(4.2);
        assertThat(result.getTotalReviews()).isEqualTo(10);
    }

    @Test
    void getMentorRating_shouldReturnZero_whenNoReviews() {
        MentorRatingDto ratingDto = MentorRatingDto.builder()
                .mentorId(5L).averageRating(0.0).totalReviews(0).build();
        when(reviewService.getMentorRating(5L)).thenReturn(ratingDto);

        MentorRatingDto result = reviewService.getMentorRating(5L);

        assertThat(result.getAverageRating()).isEqualTo(0.0);
        assertThat(result.getTotalReviews()).isEqualTo(0);
    }

    // ─── updateReview ────────────────────────────────────────────────────────

    @Test
    void updateReview_shouldReturnUpdated_whenOwner() {
        ReviewResponseDto updated = ReviewResponseDto.builder()
                .id(1L).mentorId(5L).learnerId(10L).sessionId(20L)
                .rating(5).comment("Updated comment").isAnonymous(false)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        when(reviewService.updateReview(1L, 10L, submitRequest)).thenReturn(updated);

        ReviewResponseDto result = reviewService.updateReview(1L, 10L, submitRequest);

        assertThat(result.getRating()).isEqualTo(5);
    }

    @Test
    void updateReview_shouldThrow_whenNotOwner() {
        when(reviewService.updateReview(1L, 99L, submitRequest))
                .thenThrow(new UnauthorizedException("Not owner"));

        assertThatThrownBy(() -> reviewService.updateReview(1L, 99L, submitRequest))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void updateReview_shouldThrow_whenReviewNotFound() {
        when(reviewService.updateReview(99L, 10L, submitRequest))
                .thenThrow(new ReviewNotFoundException("Not found"));

        assertThatThrownBy(() -> reviewService.updateReview(99L, 10L, submitRequest))
                .isInstanceOf(ReviewNotFoundException.class);
    }

    // ─── deleteReview ────────────────────────────────────────────────────────

    @Test
    void deleteReview_shouldSucceed_whenOwner() {
        doNothing().when(reviewService).deleteReview(1L, 10L);

        reviewService.deleteReview(1L, 10L);

        verify(reviewService).deleteReview(1L, 10L);
    }

    @Test
    void deleteReview_shouldThrow_whenNotOwner() {
        doThrow(new UnauthorizedException("Not owner")).when(reviewService).deleteReview(1L, 99L);

        assertThatThrownBy(() -> reviewService.deleteReview(1L, 99L))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void deleteReview_shouldThrow_whenNotFound() {
        doThrow(new ReviewNotFoundException("Not found")).when(reviewService).deleteReview(99L, 10L);

        assertThatThrownBy(() -> reviewService.deleteReview(99L, 10L))
                .isInstanceOf(ReviewNotFoundException.class);
    }
}

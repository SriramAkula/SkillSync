package com.skillsync.review.service.command;

import com.skillsync.review.client.MentorServiceClient;
import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.entity.Review;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.exception.UnauthorizedException;
import com.skillsync.review.mapper.ReviewMapper;
import com.skillsync.review.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewCommandServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private MentorServiceClient mentorServiceClient;
    @Mock private ReviewMapper reviewMapper;

    @InjectMocks private ReviewCommandService reviewCommandService;

    private Review review;
    private SubmitReviewRequestDto request;
    private ReviewResponseDto response;

    @BeforeEach
    void setUp() {
        review = new Review();
        review.setId(1L);
        review.setLearnerId(10L);
        review.setMentorId(5L);
        review.setRating(5);
        review.setComment("Excellent");

        request = new SubmitReviewRequestDto();
        request.setMentorId(5L);
        request.setSessionId(20L);
        request.setRating(5);
        request.setComment("Excellent");

        response = ReviewResponseDto.builder().id(1L).build();
    }

    @Test
    void submitReview_shouldSaveAndSyncRating() {
        when(reviewMapper.toEntity(anyLong(), any())).thenReturn(review);
        when(reviewRepository.save(any())).thenReturn(review);
        when(reviewMapper.toDto(any())).thenReturn(response);
        when(reviewRepository.getAverageRating(5L)).thenReturn(4.5);

        ReviewResponseDto result = reviewCommandService.submitReview(10L, request);

        assertThat(result).isNotNull();
        verify(reviewRepository).save(any());
        verify(mentorServiceClient).updateMentorRating(5L, 4.5);
    }

    @Test
    void submitReview_shouldHandleSyncFailureGracefully() {
        when(reviewMapper.toEntity(anyLong(), any())).thenReturn(review);
        when(reviewRepository.save(any())).thenReturn(review);
        when(reviewMapper.toDto(any())).thenReturn(response);
        when(reviewRepository.getAverageRating(5L)).thenReturn(4.5);
        doThrow(new RuntimeException("Sync error")).when(mentorServiceClient).updateMentorRating(anyLong(), anyDouble());

        // Should not throw exception to caller
        ReviewResponseDto result = reviewCommandService.submitReview(10L, request);

        assertThat(result).isNotNull();
        verify(reviewRepository).save(any());
    }

    @Test
    void updateReview_shouldSucceed_whenOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any())).thenReturn(review);
        when(reviewMapper.toDto(any())).thenReturn(response);

        ReviewResponseDto result = reviewCommandService.updateReview(1L, 10L, request);

        assertThat(result).isNotNull();
        verify(reviewMapper).updateEntity(review, request);
    }

    @Test
    void updateReview_shouldThrowForbidden_whenNotOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        assertThatThrownBy(() -> reviewCommandService.updateReview(1L, 99L, request))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void updateReview_shouldThrowNotFound() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewCommandService.updateReview(1L, 10L, request))
                .isInstanceOf(ReviewNotFoundException.class);
    }

    @Test
    void deleteReview_shouldSucceed_whenOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.getAverageRating(5L)).thenReturn(4.0);

        reviewCommandService.deleteReview(1L, 10L);

        verify(reviewRepository).delete(review);
        verify(mentorServiceClient).updateMentorRating(5L, 4.0);
    }

    @Test
    void deleteReview_shouldThrowUnauthorized_whenNotOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        assertThatThrownBy(() -> reviewCommandService.deleteReview(1L, 99L))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void deleteReview_shouldThrowNotFound() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewCommandService.deleteReview(1L, 10L))
                .isInstanceOf(ReviewNotFoundException.class);
    }

    @Test
    void syncMentorRating_shouldHandleNullAverageRating() {
        when(reviewMapper.toEntity(anyLong(), any())).thenReturn(review);
        when(reviewRepository.save(any())).thenReturn(review);
        when(reviewMapper.toDto(any())).thenReturn(response);
        when(reviewRepository.getAverageRating(5L)).thenReturn(null);

        reviewCommandService.submitReview(10L, request);

        verify(mentorServiceClient, never()).updateMentorRating(anyLong(), anyDouble());
    }
}

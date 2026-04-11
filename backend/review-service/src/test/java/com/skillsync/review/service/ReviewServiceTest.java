package com.skillsync.review.service;

import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.dto.response.PageResponse;
import com.skillsync.review.service.command.ReviewCommandService;
import com.skillsync.review.service.impl.ReviewServiceImpl;
import com.skillsync.review.service.query.ReviewQueryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewCommandService reviewCommandService;

    @Mock
    private ReviewQueryService reviewQueryService;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    @Test
    void submitReview_ShouldDelegateToCommandService() {
        SubmitReviewRequestDto request = new SubmitReviewRequestDto();
        ReviewResponseDto response = ReviewResponseDto.builder().id(1L).build();
        when(reviewCommandService.submitReview(10L, request)).thenReturn(response);

        ReviewResponseDto result = reviewService.submitReview(10L, request);

        assertThat(result).isEqualTo(response);
        verify(reviewCommandService).submitReview(10L, request);
    }

    @Test
    void updateReview_ShouldDelegateToCommandService() {
        SubmitReviewRequestDto request = new SubmitReviewRequestDto();
        ReviewResponseDto response = ReviewResponseDto.builder().id(1L).build();
        when(reviewCommandService.updateReview(1L, 10L, request)).thenReturn(response);

        ReviewResponseDto result = reviewService.updateReview(1L, 10L, request);

        assertThat(result).isEqualTo(response);
        verify(reviewCommandService).updateReview(1L, 10L, request);
    }

    @Test
    void deleteReview_ShouldDelegateToCommandService() {
        reviewService.deleteReview(1L, 10L);
        verify(reviewCommandService).deleteReview(1L, 10L);
    }

    @Test
    void getReview_ShouldDelegateToQueryService() {
        ReviewResponseDto response = ReviewResponseDto.builder().id(1L).build();
        when(reviewQueryService.getReview(1L)).thenReturn(response);

        ReviewResponseDto result = reviewService.getReview(1L);

        assertThat(result).isEqualTo(response);
        verify(reviewQueryService).getReview(1L);
    }

    @Test
    void getMentorReviews_ShouldDelegateToQueryService() {
        PageResponse<ReviewResponseDto> pageResponse = PageResponse.<ReviewResponseDto>builder().build();
        when(reviewQueryService.getMentorReviews(5L, 0, 10)).thenReturn(pageResponse);

        PageResponse<ReviewResponseDto> result = reviewService.getMentorReviews(5L, 0, 10);

        assertThat(result).isEqualTo(pageResponse);
        verify(reviewQueryService).getMentorReviews(5L, 0, 10);
    }

    @Test
    void getLearnerReviews_ShouldDelegateToQueryService() {
        PageResponse<ReviewResponseDto> pageResponse = PageResponse.<ReviewResponseDto>builder().build();
        when(reviewQueryService.getLearnerReviews(10L, 0, 10)).thenReturn(pageResponse);

        PageResponse<ReviewResponseDto> result = reviewService.getLearnerReviews(10L, 0, 10);

        assertThat(result).isEqualTo(pageResponse);
        verify(reviewQueryService).getLearnerReviews(10L, 0, 10);
    }

    @Test
    void getMentorRating_ShouldDelegateToQueryService() {
        MentorRatingDto ratingDto = MentorRatingDto.builder().build();
        when(reviewQueryService.getMentorRating(5L)).thenReturn(ratingDto);

        MentorRatingDto result = reviewService.getMentorRating(5L);

        assertThat(result).isEqualTo(ratingDto);
        verify(reviewQueryService).getMentorRating(5L);
    }
}


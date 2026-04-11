package com.skillsync.review.service.impl;

import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.PageResponse;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.service.command.ReviewCommandService;
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
class ReviewServiceImplTest {

    @Mock private ReviewCommandService commandService;
    @Mock private ReviewQueryService queryService;

    @InjectMocks private ReviewServiceImpl reviewService;

    @Test
    void submitReview_shouldDelegate() {
        SubmitReviewRequestDto request = new SubmitReviewRequestDto();
        ReviewResponseDto response = ReviewResponseDto.builder().build();
        when(commandService.submitReview(10L, request)).thenReturn(response);

        ReviewResponseDto result = reviewService.submitReview(10L, request);

        assertThat(result).isEqualTo(response);
        verify(commandService).submitReview(10L, request);
    }

    @Test
    void updateReview_shouldDelegate() {
        SubmitReviewRequestDto request = new SubmitReviewRequestDto();
        ReviewResponseDto response = ReviewResponseDto.builder().build();
        when(commandService.updateReview(1L, 10L, request)).thenReturn(response);

        ReviewResponseDto result = reviewService.updateReview(1L, 10L, request);

        assertThat(result).isEqualTo(response);
        verify(commandService).updateReview(1L, 10L, request);
    }

    @Test
    void deleteReview_shouldDelegate() {
        reviewService.deleteReview(1L, 10L);
        verify(commandService).deleteReview(1L, 10L);
    }

    @Test
    void getReview_shouldDelegate() {
        ReviewResponseDto response = ReviewResponseDto.builder().build();
        when(queryService.getReview(1L)).thenReturn(response);

        ReviewResponseDto result = reviewService.getReview(1L);

        assertThat(result).isEqualTo(response);
        verify(queryService).getReview(1L);
    }

    @Test
    void getMentorReviews_shouldDelegate() {
        PageResponse<ReviewResponseDto> pageResponse = PageResponse.<ReviewResponseDto>builder().build();
        when(queryService.getMentorReviews(5L, 0, 10)).thenReturn(pageResponse);

        PageResponse<ReviewResponseDto> result = reviewService.getMentorReviews(5L, 0, 10);

        assertThat(result).isEqualTo(pageResponse);
        verify(queryService).getMentorReviews(5L, 0, 10);
    }

    @Test
    void getLearnerReviews_shouldDelegate() {
        PageResponse<ReviewResponseDto> pageResponse = PageResponse.<ReviewResponseDto>builder().build();
        when(queryService.getLearnerReviews(10L, 0, 10)).thenReturn(pageResponse);

        PageResponse<ReviewResponseDto> result = reviewService.getLearnerReviews(10L, 0, 10);

        assertThat(result).isEqualTo(pageResponse);
        verify(queryService).getLearnerReviews(10L, 0, 10);
    }

    @Test
    void getMentorRating_shouldDelegate() {
        MentorRatingDto ratingDto = MentorRatingDto.builder().build();
        when(queryService.getMentorRating(5L)).thenReturn(ratingDto);

        MentorRatingDto result = reviewService.getMentorRating(5L);

        assertThat(result).isEqualTo(ratingDto);
        verify(queryService).getMentorRating(5L);
    }
}

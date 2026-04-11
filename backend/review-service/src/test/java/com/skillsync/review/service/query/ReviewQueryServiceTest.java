package com.skillsync.review.service.query;

import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.PageResponse;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.entity.Review;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.mapper.ReviewMapper;
import com.skillsync.review.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewQueryServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private ReviewMapper reviewMapper;

    @InjectMocks private ReviewQueryService reviewQueryService;

    private Review review;
    private ReviewResponseDto responseDto;

    @BeforeEach
    void setUp() {
        review = new Review();
        review.setId(1L);
        review.setMentorId(5L);
        review.setLearnerId(10L);

        responseDto = ReviewResponseDto.builder().id(1L).build();
    }

    @Test
    void getReview_shouldReturnDto() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewMapper.toDto(review)).thenReturn(responseDto);

        ReviewResponseDto result = reviewQueryService.getReview(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getReview_shouldThrowNotFound() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewQueryService.getReview(1L))
                .isInstanceOf(ReviewNotFoundException.class);
    }

    @Test
    void getMentorReviews_shouldReturnPaginatedResponse() {
        Page<Review> page = new PageImpl<>(Collections.singletonList(review));
        when(reviewRepository.findByMentorId(eq(5L), any(Pageable.class))).thenReturn(page);
        when(reviewMapper.toDto(any())).thenReturn(responseDto);

        PageResponse<ReviewResponseDto> result = reviewQueryService.getMentorReviews(5L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void getLearnerReviews_shouldReturnPaginatedResponse() {
        Page<Review> page = new PageImpl<>(Collections.singletonList(review));
        when(reviewRepository.findByLearnerId(eq(10L), any(Pageable.class))).thenReturn(page);
        when(reviewMapper.toDto(any())).thenReturn(responseDto);

        PageResponse<ReviewResponseDto> result = reviewQueryService.getLearnerReviews(10L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getMentorRating_shouldReturnRatingDto() {
        MentorRatingDto ratingDto = MentorRatingDto.builder().mentorId(5L).averageRating(4.5).build();
        when(reviewRepository.getAverageRating(5L)).thenReturn(4.5);
        when(reviewRepository.getTotalReviewCount(5L)).thenReturn(10);
        when(reviewRepository.getTotalLearnerCount(5L)).thenReturn(8);
        when(reviewMapper.toRatingDto(anyLong(), anyDouble(), anyInt(), anyInt())).thenReturn(ratingDto);

        MentorRatingDto result = reviewQueryService.getMentorRating(5L);

        assertThat(result).isNotNull();
        assertThat(result.getAverageRating()).isEqualTo(4.5);
    }
}

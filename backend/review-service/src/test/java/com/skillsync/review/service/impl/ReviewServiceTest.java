package com.skillsync.review.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skillsync.review.client.MentorServiceClient;
import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.entity.Review;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.exception.UnauthorizedException;
import com.skillsync.review.mapper.ReviewMapper;
import com.skillsync.review.repository.ReviewRepository;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private MentorServiceClient mentorServiceClient;
    @Mock private ReviewMapper reviewMapper;

    @InjectMocks private ReviewServiceImpl reviewService;

    private Review review;
    private SubmitReviewRequestDto submitRequest;
    private ReviewResponseDto reviewResponse;

    @BeforeEach
    void setUp() {
        review = new Review();
        review.setId(1L);
        review.setMentorId(100L);
        review.setLearnerId(200L);
        review.setRating(4);
        review.setComment("Great mentor!");

        submitRequest = new SubmitReviewRequestDto();
        submitRequest.setMentorId(100L);
        submitRequest.setRating(5);
        submitRequest.setComment("Excellent!");

        reviewResponse = ReviewResponseDto.builder()
                .id(1L).mentorId(100L).learnerId(200L)
                .rating(4).comment("Great mentor!").isAnonymous(false)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void submitReview_ShouldSaveReviewAndUpdateRating() {
        when(reviewMapper.toEntity(200L, submitRequest)).thenReturn(review);
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewMapper.toDto(review)).thenReturn(reviewResponse);
        when(reviewRepository.getAverageRating(100L)).thenReturn(4.5);

        ReviewResponseDto response = reviewService.submitReview(200L, submitRequest);

        assertNotNull(response);
        verify(reviewRepository).save(review);
        verify(mentorServiceClient).updateMentorRating(100L, 4.5);
    }

    @Test
    void submitReview_ShouldSucceed_EvenWhenFeignFails() {
        when(reviewMapper.toEntity(200L, submitRequest)).thenReturn(review);
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewMapper.toDto(review)).thenReturn(reviewResponse);
        when(reviewRepository.getAverageRating(100L)).thenReturn(4.5);
        doThrow(new RuntimeException("Feign error")).when(mentorServiceClient).updateMentorRating(anyLong(), anyDouble());

        ReviewResponseDto response = reviewService.submitReview(200L, submitRequest);

        assertNotNull(response);
        verify(reviewRepository).save(review);
    }

    @Test
    void getReview_ShouldReturnReview_WhenExists() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewMapper.toDto(review)).thenReturn(reviewResponse);

        ReviewResponseDto response = reviewService.getReview(1L);

        assertNotNull(response);
        assertEquals("Great mentor!", response.getComment());
    }

    @Test
    void getReview_ShouldThrow_WhenNotFound() {
        when(reviewRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ReviewNotFoundException.class, () -> reviewService.getReview(99L));
    }

    @Test
    void getMentorRating_ShouldReturnCorrectStats() {
        MentorRatingDto ratingDto = MentorRatingDto.builder()
                .mentorId(100L).averageRating(4.567).totalReviews(10).totalLearners(5).build();
        when(reviewRepository.getAverageRating(100L)).thenReturn(4.567);
        when(reviewRepository.getTotalReviewCount(100L)).thenReturn(10);
        when(reviewRepository.getTotalLearnerCount(100L)).thenReturn(5);
        when(reviewMapper.toRatingDto(100L, 4.567, 10, 5)).thenReturn(ratingDto);

        MentorRatingDto rating = reviewService.getMentorRating(100L);

        assertEquals(4.567, rating.getAverageRating());
        assertEquals(10, rating.getTotalReviews());
    }

    @Test
    void updateReview_ShouldSuccess_WhenOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewMapper.toDto(review)).thenReturn(reviewResponse);
        when(reviewRepository.getAverageRating(100L)).thenReturn(5.0);

        ReviewResponseDto response = reviewService.updateReview(1L, 200L, submitRequest);

        assertNotNull(response);
        verify(reviewMapper).updateEntity(review, submitRequest);
        verify(reviewRepository).save(review);
    }

    @Test
    void updateReview_ShouldThrowUnauthorized_WhenNotOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        assertThrows(UnauthorizedException.class, () -> reviewService.updateReview(1L, 999L, submitRequest));
    }

    @Test
    void deleteReview_ShouldSuccess_WhenOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.getAverageRating(100L)).thenReturn(4.0);

        reviewService.deleteReview(1L, 200L);

        verify(reviewRepository).delete(review);
        verify(mentorServiceClient).updateMentorRating(100L, 4.0);
    }

    @Test
    void deleteReview_ShouldThrowUnauthorized_WhenNotOwner() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        assertThrows(UnauthorizedException.class, () -> reviewService.deleteReview(1L, 999L));
        verify(reviewRepository, never()).delete(any());
    }
}

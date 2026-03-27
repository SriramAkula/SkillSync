package com.skillsync.review.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
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
import com.skillsync.review.repository.ReviewRepository;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private MentorServiceClient mentorServiceClient;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private Review review;
    private SubmitReviewRequestDto submitRequest;

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
    }

    @Test
    void submitReview_ShouldSaveReviewAndUpdateRating() {
        // Arrange
        when(reviewRepository.save(any(Review.class))).thenReturn(review);
        when(reviewRepository.getAverageRating(anyLong())).thenReturn(4.5);

        // Act
        ReviewResponseDto response = reviewService.submitReview(200L, submitRequest);

        // Assert
        assertNotNull(response);
        verify(reviewRepository, times(1)).save(any(Review.class));
        verify(mentorServiceClient, times(1)).updateMentorRating(100L, 4.5);
    }

    @Test
    void submitReview_ShouldSucceed_EvenWhenFeignFails() {
        // Arrange
        when(reviewRepository.save(any(Review.class))).thenReturn(review);
        when(reviewRepository.getAverageRating(anyLong())).thenReturn(4.5);
        doThrow(new RuntimeException("Feign error")).when(mentorServiceClient).updateMentorRating(anyLong(), anyDouble());

        // Act
        ReviewResponseDto response = reviewService.submitReview(200L, submitRequest);

        // Assert
        assertNotNull(response);
        verify(reviewRepository, times(1)).save(any(Review.class));
    }

    @Test
    void getReview_ShouldReturnReview_WhenExists() {
        // Arrange
        when(reviewRepository.findById(anyLong())).thenReturn(Optional.of(review));

        // Act
        ReviewResponseDto response = reviewService.getReview(1L);

        // Assert
        assertNotNull(response);
        assertEquals(review.getComment(), response.getComment());
    }

    @Test
    void getMentorRating_ShouldReturnCorrectStats() {
        // Arrange
        when(reviewRepository.getAverageRating(anyLong())).thenReturn(4.567);
        when(reviewRepository.getTotalReviewCount(anyLong())).thenReturn(10);

        // Act
        MentorRatingDto rating = reviewService.getMentorRating(100L);

        // Assert
        assertEquals(4.567, rating.getAverageRating());
        assertEquals(10, rating.getTotalReviews());
    }

    @Test
    void updateReview_ShouldSuccess_WhenOwner() {
        // Arrange
        when(reviewRepository.findById(anyLong())).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(Review.class))).thenReturn(review);
        when(reviewRepository.getAverageRating(anyLong())).thenReturn(5.0);

        // Act
        ReviewResponseDto response = reviewService.updateReview(1L, 200L, submitRequest);

        // Assert
        assertNotNull(response);
        verify(reviewRepository, times(1)).save(review);
    }

    @Test
    void updateReview_ShouldThrowUnauthorized_WhenNotOwner() {
        // Arrange
        when(reviewRepository.findById(anyLong())).thenReturn(Optional.of(review));

        // Act & Assert
        assertThrows(UnauthorizedException.class, () -> reviewService.updateReview(1L, 999L, submitRequest));
    }

    @Test
    void deleteReview_ShouldSuccess_WhenOwner() {
        // Arrange
        when(reviewRepository.findById(anyLong())).thenReturn(Optional.of(review));
        when(reviewRepository.getAverageRating(anyLong())).thenReturn(4.0);

        // Act
        reviewService.deleteReview(1L, 200L);

        // Assert
        verify(reviewRepository, times(1)).delete(review);
        verify(mentorServiceClient, times(1)).updateMentorRating(100L, 4.0);
    }
}

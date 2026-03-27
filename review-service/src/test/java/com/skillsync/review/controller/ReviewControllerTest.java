package com.skillsync.review.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.exception.ReviewNotFoundException;
import com.skillsync.review.exception.UnauthorizedException;
import com.skillsync.review.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@WebMvcTest(
    controllers = ReviewController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = com.skillsync.review.filter.GatewayRequestFilter.class
    )
)
class ReviewControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean ReviewService reviewService;

    private ReviewResponseDto reviewResponse;
    private SubmitReviewRequestDto reviewRequest;

    @BeforeEach
    void setUp() {
        reviewResponse = ReviewResponseDto.builder()
                .id(1L).mentorId(5L).learnerId(10L).sessionId(20L)
                .rating(4).comment("Great session").isAnonymous(false)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        reviewRequest = new SubmitReviewRequestDto();
        reviewRequest.setMentorId(5L);
        reviewRequest.setSessionId(20L);
        reviewRequest.setRating(4);
        reviewRequest.setComment("Great session");
        reviewRequest.setIsAnonymous(false);
    }

    // ─── POST /review ────────────────────────────────────────────────────────

    @Test
    void submitReview_shouldReturn201_whenLearnerRole() throws Exception {
        when(reviewService.submitReview(eq(10L), any())).thenReturn(reviewResponse);

        mockMvc.perform(post("/review")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.rating").value(4));
    }

    @Test
    void submitReview_shouldReturn403_whenNotLearner() throws Exception {
        mockMvc.perform(post("/review")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_MENTOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isForbidden());

        verify(reviewService, never()).submitReview(anyLong(), any());
    }

    @Test
    void submitReview_shouldReturn400_whenRatingNull() throws Exception {
        reviewRequest.setRating(null);

        mockMvc.perform(post("/review")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitReview_shouldReturn400_whenRatingOutOfRange() throws Exception {
        reviewRequest.setRating(6);

        mockMvc.perform(post("/review")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isBadRequest());
    }

    // ─── GET /review/{reviewId} ──────────────────────────────────────────────

    @Test
    void getReview_shouldReturn200_whenExists() throws Exception {
        when(reviewService.getReview(1L)).thenReturn(reviewResponse);

        mockMvc.perform(get("/review/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void getReview_shouldReturn404_whenNotFound() throws Exception {
        when(reviewService.getReview(99L)).thenThrow(new ReviewNotFoundException("Not found"));

        mockMvc.perform(get("/review/99"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /review/mentors/{mentorId} ──────────────────────────────────────

    @Test
    void getMentorReviews_shouldReturn200_withList() throws Exception {
        when(reviewService.getMentorReviews(5L)).thenReturn(List.of(reviewResponse));

        mockMvc.perform(get("/review/mentors/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].mentorId").value(5));
    }

    @Test
    void getMentorReviews_shouldReturn200_withEmptyList() throws Exception {
        when(reviewService.getMentorReviews(99L)).thenReturn(List.of());

        mockMvc.perform(get("/review/mentors/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ─── GET /review/mentors/{mentorId}/rating ───────────────────────────────

    @Test
    void getMentorRating_shouldReturn200_withRating() throws Exception {
        MentorRatingDto ratingDto = MentorRatingDto.builder()
                .mentorId(5L).averageRating(4.2).totalReviews(10).build();
        when(reviewService.getMentorRating(5L)).thenReturn(ratingDto);

        mockMvc.perform(get("/review/mentors/5/rating"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.averageRating").value(4.2))
                .andExpect(jsonPath("$.data.totalReviews").value(10));
    }

    // ─── PUT /review/{reviewId} ──────────────────────────────────────────────

    @Test
    void updateReview_shouldReturn200_whenLearnerAndOwner() throws Exception {
        when(reviewService.updateReview(eq(1L), eq(10L), any())).thenReturn(reviewResponse);

        mockMvc.perform(put("/review/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Review updated successfully"));
    }

    @Test
    void updateReview_shouldReturn403_whenNotLearner() throws Exception {
        mockMvc.perform(put("/review/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_MENTOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateReview_shouldReturn403_whenNotOwner() throws Exception {
        when(reviewService.updateReview(eq(1L), eq(10L), any()))
                .thenThrow(new UnauthorizedException("Not owner"));

        mockMvc.perform(put("/review/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isForbidden());
    }

    // ─── DELETE /review/{reviewId} ───────────────────────────────────────────

    @Test
    void deleteReview_shouldReturn200_whenLearnerAndOwner() throws Exception {
        doNothing().when(reviewService).deleteReview(1L, 10L);

        mockMvc.perform(delete("/review/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Review deleted successfully"));
    }

    @Test
    void deleteReview_shouldReturn403_whenNotLearner() throws Exception {
        mockMvc.perform(delete("/review/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteReview_shouldReturn404_whenNotFound() throws Exception {
        doThrow(new ReviewNotFoundException("Not found")).when(reviewService).deleteReview(99L, 10L);

        mockMvc.perform(delete("/review/99")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isNotFound());
    }
}

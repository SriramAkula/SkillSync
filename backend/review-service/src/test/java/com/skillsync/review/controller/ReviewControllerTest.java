package com.skillsync.review.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.review.dto.request.SubmitReviewRequestDto;
import com.skillsync.review.dto.response.MentorRatingDto;
import com.skillsync.review.dto.response.ReviewResponseDto;
import com.skillsync.review.dto.response.PageResponse;
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
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
    void getReview_shouldReturn200_whenExists() throws Exception {
        when(reviewService.getReview(1L)).thenReturn(reviewResponse);

        mockMvc.perform(get("/review/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void getMentorReviews_shouldReturn200_withList() throws Exception {
        PageResponse<ReviewResponseDto> pageResponse = PageResponse.<ReviewResponseDto>builder()
                .content(List.of(reviewResponse))
                .totalElements(1L)
                .totalPages(1)
                .currentPage(0)
                .pageSize(10)
                .build();
        when(reviewService.getMentorReviews(eq(5L), anyInt(), anyInt())).thenReturn(pageResponse);

        mockMvc.perform(get("/review/mentors/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].mentorId").value(5));
    }

    @Test
    void getMentorRating_shouldReturn200_withRating() throws Exception {
        MentorRatingDto ratingDto = MentorRatingDto.builder()
                .mentorId(5L).averageRating(4.2).totalReviews(10).build();
        when(reviewService.getMentorRating(5L)).thenReturn(ratingDto);

        mockMvc.perform(get("/review/mentors/5/rating"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.averageRating").value(4.2));
    }

    @Test
    void updateReview_shouldReturn200_whenLearnerAndOwner() throws Exception {
        when(reviewService.updateReview(eq(1L), eq(10L), any())).thenReturn(reviewResponse);

        mockMvc.perform(put("/review/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteReview_shouldReturn200_whenLearnerAndOwner() throws Exception {
        doNothing().when(reviewService).deleteReview(1L, 10L);

        mockMvc.perform(delete("/review/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk());
    }
}


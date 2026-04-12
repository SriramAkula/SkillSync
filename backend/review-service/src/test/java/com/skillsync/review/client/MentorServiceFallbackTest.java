package com.skillsync.review.client;

import static org.assertj.core.api.Assertions.assertThat;

import com.skillsync.review.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

class MentorServiceFallbackTest {

    private final MentorServiceFallback mentorServiceFallback = new MentorServiceFallback();

    @Test
    void updateMentorRating_shouldReturn503Response() {
        ResponseEntity<ApiResponse<Void>> response = mentorServiceFallback.updateMentorRating(1L, 4.5);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getStatusCode()).isEqualTo(503);
        assertThat(response.getBody().getMessage()).isEqualTo("Mentor service temporarily unavailable");
    }
}

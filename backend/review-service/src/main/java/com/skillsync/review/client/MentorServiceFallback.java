package com.skillsync.review.client;

import com.skillsync.review.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Component
@Slf4j
public class MentorServiceFallback implements MentorServiceClient {
    
    @Override
    public ResponseEntity<ApiResponse<Void>> updateMentorRating(
            @PathVariable Long mentorId,
            @RequestParam Double newRating) {
        log.warn("Mentor service unavailable. Fallback for updating rating of mentor {}", mentorId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .success(false)
            .data(null)
            .message("Mentor service temporarily unavailable")
            .statusCode(503)
            .build());
    }
}

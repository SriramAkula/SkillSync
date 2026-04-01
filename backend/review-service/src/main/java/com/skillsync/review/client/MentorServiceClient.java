package com.skillsync.review.client;

import com.skillsync.review.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "mentor-service", fallback = MentorServiceFallback.class)
public interface MentorServiceClient {
    
    @PutMapping("/mentor/{mentorId}/rating")
    ResponseEntity<ApiResponse<Void>> updateMentorRating(
        @PathVariable Long mentorId,
        @RequestParam Double newRating);
}

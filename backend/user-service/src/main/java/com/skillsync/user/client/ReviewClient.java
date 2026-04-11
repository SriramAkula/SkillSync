package com.skillsync.user.client;

import com.skillsync.user.dto.internal.MentorRatingDto;
import com.skillsync.user.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
@FeignClient(name = "review-service", url = "${REVIEW_SERVICE_URL:http://review-service:8087}")
public interface ReviewClient {

    @GetMapping("/review/mentors/{mentorId}/rating")
    ApiResponse<MentorRatingDto> getMentorRating(
            @PathVariable("mentorId") Long mentorId
    );
}


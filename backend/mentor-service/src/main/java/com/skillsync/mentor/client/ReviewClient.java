package com.skillsync.mentor.client;

import com.skillsync.mentor.dto.ApiResponse;
import com.skillsync.mentor.dto.response.MentorRatingDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "review-service", path = "/review")
public interface ReviewClient {

    @GetMapping("/mentors/{mentorId}/rating")
    ResponseEntity<ApiResponse<MentorRatingDto>> getMentorRating(@PathVariable("mentorId") Long mentorId);
}


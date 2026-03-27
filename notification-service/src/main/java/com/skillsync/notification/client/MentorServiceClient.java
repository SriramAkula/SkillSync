package com.skillsync.notification.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for communicating with Mentor Service
 * Used to fetch mentor profile details including userId
 */
@FeignClient(name = "mentor-service", fallback = MentorServiceClientFallback.class)
public interface MentorServiceClient {
    
    @GetMapping("/mentor/internal/{mentorId}")
    MentorProfileResponse getMentorbyId(@PathVariable("mentorId") Long mentorId);
}

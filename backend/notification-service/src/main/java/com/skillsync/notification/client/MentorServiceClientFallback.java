package com.skillsync.notification.client;

import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * Fallback implementation for MentorServiceClient
 * Used when Mentor Service is unavailable
 */
@Component
@Slf4j
public class MentorServiceClientFallback implements MentorServiceClient {
    
    @Override
    public MentorProfileResponse getMentorbyId(Long mentorId) {
        log.warn("Fallback: Unable to fetch mentor profile for mentorId: {}", mentorId);
        return null;
    }
}


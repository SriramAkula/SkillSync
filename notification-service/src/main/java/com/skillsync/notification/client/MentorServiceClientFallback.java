package com.skillsync.notification.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Fallback implementation for MentorServiceClient
 * Used when Mentor Service is unavailable
 */
@Component
public class MentorServiceClientFallback implements MentorServiceClient {
    
    private static final Logger log = LoggerFactory.getLogger(MentorServiceClientFallback.class);
    
    @Override
    public MentorProfileResponse getMentorbyId(Long mentorId) {
        log.warn("Fallback: Unable to fetch mentor profile for mentorId: {}", mentorId);
        return null;
    }
}

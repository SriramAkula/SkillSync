package com.skillsync.payment.client;

import com.skillsync.payment.client.dto.MentorRateDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "mentor-service", fallback = MentorServiceClient.MentorServiceFallback.class)
public interface MentorServiceClient {

    @GetMapping("/mentor/{mentorId}")
    MentorRateDto getMentorProfile(@PathVariable Long mentorId);

    class MentorServiceFallback implements MentorServiceClient {
        private static final Logger log = LoggerFactory.getLogger(MentorServiceFallback.class);

        @Override
        public MentorRateDto getMentorProfile(Long mentorId) {
            log.error("Fallback: mentor-service unavailable for getMentorProfile({})", mentorId);
            throw new RuntimeException("mentor-service is currently unavailable");
        }
    }
}

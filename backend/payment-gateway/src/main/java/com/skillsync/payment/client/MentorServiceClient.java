package com.skillsync.payment.client;

import com.skillsync.payment.client.dto.MentorRateDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "mentor-service", fallback = MentorServiceClient.MentorServiceFallback.class)
public interface MentorServiceClient {

    @GetMapping("/mentor/internal/{mentorId}")
    MentorRateDto fetchMentorProfileForSaga(@PathVariable Long mentorId);

    @Slf4j
    class MentorServiceFallback implements MentorServiceClient {

        @Override
        public MentorRateDto fetchMentorProfileForSaga(Long mentorId) {
            log.error("Fallback: mentor-service unavailable for fetchMentorProfileForSaga({})", mentorId);
            throw new RuntimeException("mentor-service is currently unavailable");
        }
    }
}

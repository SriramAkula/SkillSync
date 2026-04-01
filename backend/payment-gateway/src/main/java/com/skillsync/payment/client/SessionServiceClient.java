package com.skillsync.payment.client;

import com.skillsync.payment.client.dto.SessionDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "session-service", fallback = SessionServiceClient.SessionServiceFallback.class)
public interface SessionServiceClient {

    @GetMapping("/session/{sessionId}")
    SessionDto getSession(@PathVariable Long sessionId);

    @PutMapping("/session/{sessionId}/status")
    void updateSessionStatus(@PathVariable Long sessionId, @RequestParam String status);

    class SessionServiceFallback implements SessionServiceClient {
        private static final Logger log = LoggerFactory.getLogger(SessionServiceFallback.class);

        @Override
        public SessionDto getSession(Long sessionId) {
            log.error("Fallback: session-service unavailable for getSession({})", sessionId);
            throw new RuntimeException("session-service is currently unavailable");
        }

        @Override
        public void updateSessionStatus(Long sessionId, String status) {
            log.error("Fallback: session-service unavailable for updateSessionStatus({}, {})", sessionId, status);
            throw new RuntimeException("session-service is currently unavailable");
        }
    }
}

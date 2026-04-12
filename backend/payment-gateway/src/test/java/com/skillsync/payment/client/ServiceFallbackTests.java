package com.skillsync.payment.client;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ServiceFallbackTests {

    @Test
    void mentorServiceFallback_shouldThrowException() {
        MentorServiceClient.MentorServiceFallback fallback = new MentorServiceClient.MentorServiceFallback();
        assertThrows(RuntimeException.class, () -> fallback.fetchMentorProfileForSaga(1L));
    }

    @Test
    void sessionServiceFallback_shouldThrowException() {
        SessionServiceClient.SessionServiceFallback fallback = new SessionServiceClient.SessionServiceFallback();
        assertThrows(RuntimeException.class, () -> fallback.getSession(1L));
        assertThrows(RuntimeException.class, () -> fallback.updateSessionStatus(1L, "STATUS"));
    }
}

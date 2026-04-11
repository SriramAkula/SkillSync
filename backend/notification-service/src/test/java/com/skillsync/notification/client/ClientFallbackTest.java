package com.skillsync.notification.client;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ClientFallbackTest {

    @Test
    void userServiceClientFallback_shouldReturnNonNullResponse() {
        UserServiceClientFallback fallback = new UserServiceClientFallback();
        assertThat(fallback.getUserById(1L)).isNotNull();
        assertThat(fallback.getUserById(1L).getData().getEmail()).contains("@example.com");
    }

    @Test
    void mentorServiceClientFallback_shouldReturnNull() {
        MentorServiceClientFallback fallback = new MentorServiceClientFallback();
        assertThat(fallback.getMentorbyId(1L)).isNull();
    }
}

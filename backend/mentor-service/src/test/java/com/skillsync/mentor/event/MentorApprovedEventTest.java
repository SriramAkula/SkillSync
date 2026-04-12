package com.skillsync.mentor.event;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class MentorApprovedEventTest {

    @Test
    void constructorAndGetters_shouldPerformCorrectly() {
        MentorApprovedEvent event = new MentorApprovedEvent(1L, 100L, "Java");

        assertThat(event.getMentorId()).isEqualTo(1L);
        assertThat(event.getUserId()).isEqualTo(100L);
        assertThat(event.getMentorName()).isEqualTo("Java");
    }

    @Test
    void settersAndGetters_shouldPerformCorrectly() {
        MentorApprovedEvent event = new MentorApprovedEvent();
        event.setMentorId(1L);
        event.setUserId(100L);
        event.setMentorName("Java");

        assertThat(event.getMentorId()).isEqualTo(1L);
        assertThat(event.getUserId()).isEqualTo(100L);
        assertThat(event.getMentorName()).isEqualTo("Java");
    }
}

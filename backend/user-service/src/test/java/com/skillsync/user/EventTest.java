package com.skillsync.user;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import com.skillsync.user.event.UserCreatedEvent;
import com.skillsync.user.event.UserUpdatedEvent;

class EventTest {

    @Test
    void testUserCreatedEvent() {
        UserCreatedEvent event = new UserCreatedEvent(1L, "e", "n", "u", "r", 123L);
        assertThat(event.getUserId()).isEqualTo(1L);
        assertThat(event.getEmail()).isEqualTo("e");
        assertThat(event.getName()).isEqualTo("n");
        assertThat(event.getUsername()).isEqualTo("u");
        assertThat(event.getRole()).isEqualTo("r");
        assertThat(event.getCreatedAtMillis()).isEqualTo(123L);

        UserCreatedEvent empty = new UserCreatedEvent();
        empty.setUserId(2L);
        assertThat(empty.getUserId()).isEqualTo(2L);
        
        assertThat(event.toString()).contains("userId=1");
        assertThat(event.equals(new UserCreatedEvent(1L, "e", "n", "u", "r", 123L))).isTrue();
        assertThat(event.hashCode()).isNotZero();
    }

    @Test
    void testUserUpdatedEvent() {
        UserUpdatedEvent event = new UserUpdatedEvent(1L, "e", "n", "u", "r", true, 456L);
        assertThat(event.getUserId()).isEqualTo(1L);
        assertThat(event.getEmail()).isEqualTo("e");
        assertThat(event.getName()).isEqualTo("n");
        assertThat(event.getUsername()).isEqualTo("u");
        assertThat(event.getRole()).isEqualTo("r");
        assertThat(event.getIsActive()).isTrue();
        assertThat(event.getUpdatedAtMillis()).isEqualTo(456L);

        UserUpdatedEvent empty = new UserUpdatedEvent();
        empty.setIsActive(false);
        assertThat(empty.getIsActive()).isFalse();

        assertThat(event.toString()).contains("userId=1");
        assertThat(event.equals(new UserUpdatedEvent(1L, "e", "n", "u", "r", true, 456L))).isTrue();
        assertThat(event.hashCode()).isNotZero();
    }
}

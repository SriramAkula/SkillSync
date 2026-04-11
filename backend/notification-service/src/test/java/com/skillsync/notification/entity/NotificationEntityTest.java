package com.skillsync.notification.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationEntityTest {

    @Test
    void testGettersSettersAndBuilder() {
        LocalDateTime now = LocalDateTime.now();
        Notification notification = Notification.builder()
                .id(1L)
                .userId(10L)
                .type("SESSION_REQUESTED")
                .message("Hello")
                .data("{}")
                .read(false)
                .sentAt(now)
                .build();
        
        notification.setRead(true);
        notification.setIsRead(true);
        
        assertThat(notification.getId()).isEqualTo(1L);
        assertThat(notification.getUserId()).isEqualTo(10L);
        assertThat(notification.getType()).isEqualTo("SESSION_REQUESTED");
        assertThat(notification.getMessage()).isEqualTo("Hello");
        assertThat(notification.getData()).isEqualTo("{}");
        assertThat(notification.getRead()).isTrue();
        assertThat(notification.getIsRead()).isTrue();
        assertThat(notification.getSentAt()).isEqualTo(now);
    }
    
    @Test
    void testNoArgsConstructor() {
        Notification notification = new Notification();
        assertThat(notification).isNotNull();
    }
    
    @Test
    void testAllArgsConstructor() {
        LocalDateTime now = LocalDateTime.now();
        Notification notification = new Notification(1L, 10L, "TYPE", "MSG", "{}", true, now);
        assertThat(notification.getId()).isEqualTo(1L);
    }
}

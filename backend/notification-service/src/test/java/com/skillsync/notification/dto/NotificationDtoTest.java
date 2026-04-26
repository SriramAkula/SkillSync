package com.skillsync.notification.dto;

import com.skillsync.notification.entity.Notification;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationDtoTest {

    @Test
    void testGettersAndSetters() {
        LocalDateTime now = LocalDateTime.now();
        NotificationDto dto = new NotificationDto();
        
        dto.setId(1L);
        dto.setUserId(10L);
        dto.setType("TEST");
        dto.setMessage("msg");
        dto.setData("{}");
        dto.setRead(true);
        dto.setIsRead(true);
        dto.setCreatedAt(now);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getUserId()).isEqualTo(10L);
        assertThat(dto.getType()).isEqualTo("TEST");
        assertThat(dto.getMessage()).isEqualTo("msg");
        assertThat(dto.getData()).isEqualTo("{}");
        assertThat(dto.getRead()).isTrue();
        assertThat(dto.getIsRead()).isTrue();
        assertThat(dto.getCreatedAt()).isEqualTo(now);
    }

    @Test
    void testFromEntity() {
        LocalDateTime now = LocalDateTime.now();
        Notification entity = Notification.builder()
                .id(1L)
                .userId(10L)
                .type("TEST")
                .message("msg")
                .data("{}")
                .read(true)
                .createdAt(now)
                .build();

        NotificationDto dto = NotificationDto.fromEntity(entity);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getUserId()).isEqualTo(10L);
        assertThat(dto.getType()).isEqualTo("TEST");
        assertThat(dto.getCreatedAt()).isEqualTo(now);
    }
}

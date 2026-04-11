package com.skillsync.notification.service.query;

import com.skillsync.notification.dto.NotificationDto;
import com.skillsync.notification.dto.response.PageResponse;
import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationQueryServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private NotificationQueryService notificationQueryService;

    private Notification notification;

    @BeforeEach
    void setUp() {
        notification = new Notification();
        notification.setId(1L);
        notification.setUserId(10L);
        notification.setMessage("Test message");
    }

    @Test
    void getUserNotifications_shouldReturnPaginatedResponse() {
        Page<Notification> page = new PageImpl<>(List.of(notification));
        when(notificationRepository.findByUserId(anyLong(), any(Pageable.class))).thenReturn(page);

        PageResponse<NotificationDto> result = notificationQueryService.getUserNotifications(10L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void getUserUnreadNotifications_shouldReturnPaginatedResponse() {
        Page<Notification> page = new PageImpl<>(List.of(notification));
        when(notificationRepository.findUnreadByUserId(anyLong(), any(Pageable.class))).thenReturn(page);

        PageResponse<NotificationDto> result = notificationQueryService.getUserUnreadNotifications(10L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getUnreadCount_shouldReturnCount() {
        when(notificationRepository.countUnreadByUserId(10L)).thenReturn(5);

        Integer result = notificationQueryService.getUnreadCount(10L);

        assertThat(result).isEqualTo(5);
    }
}

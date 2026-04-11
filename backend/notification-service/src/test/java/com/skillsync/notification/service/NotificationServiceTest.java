package com.skillsync.notification.service;

import com.skillsync.notification.dto.NotificationDto;
import com.skillsync.notification.dto.response.PageResponse;
import com.skillsync.notification.service.command.NotificationCommandService;
import com.skillsync.notification.service.query.NotificationQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationCommandService commandService;

    @Mock
    private NotificationQueryService queryService;

    @InjectMocks
    private NotificationService notificationService;

    private NotificationDto notificationDto;

    @BeforeEach
    void setUp() {
        notificationDto = new NotificationDto();
        notificationDto.setId(1L);
        notificationDto.setUserId(10L);
        notificationDto.setType("SESSION_REQUESTED");
        notificationDto.setMessage("New session request");
        notificationDto.setIsRead(false);
        notificationDto.setSentAt(LocalDateTime.now());
    }

    @Test
    void getUserNotifications_shouldReturnPaginatedNotifications() {
        PageResponse<NotificationDto> pageResponse = PageResponse.<NotificationDto>builder()
            .content(List.of(notificationDto))
            .totalElements(1L)
            .currentPage(0)
            .pageSize(10)
            .build();
        when(queryService.getUserNotifications(eq(10L), anyInt(), anyInt())).thenReturn(pageResponse);

        PageResponse<NotificationDto> result = notificationService.getUserNotifications(10L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getUserId()).isEqualTo(10L);
    }

    @Test
    void getUserUnreadNotifications_shouldReturnPaginatedUnreadNotifications() {
        PageResponse<NotificationDto> pageResponse = PageResponse.<NotificationDto>builder()
            .content(List.of(notificationDto))
            .totalElements(1L)
            .currentPage(0)
            .pageSize(10)
            .build();
        when(queryService.getUserUnreadNotifications(eq(10L), anyInt(), anyInt())).thenReturn(pageResponse);

        PageResponse<NotificationDto> result = notificationService.getUserUnreadNotifications(10L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getIsRead()).isFalse();
    }

    @Test
    void getUnreadCount_shouldReturnCount() {
        when(queryService.getUnreadCount(10L)).thenReturn(5);

        int count = notificationService.getUnreadCount(10L);

        assertThat(count).isEqualTo(5);
    }

    @Test
    void markAsRead_shouldCallCommandService() {
        doNothing().when(commandService).markAsRead(1L, 10L);

        notificationService.markAsRead(1L, 10L);

        verify(commandService, times(1)).markAsRead(1L, 10L);
    }

    @Test
    void deleteNotification_shouldCallCommandService() {
        doNothing().when(commandService).deleteNotification(1L, 10L);

        notificationService.deleteNotification(1L, 10L);

        verify(commandService, times(1)).deleteNotification(1L, 10L);
    }
}


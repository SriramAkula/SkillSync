package com.skillsync.notification.service;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.exception.NotificationNotFoundException;
import com.skillsync.notification.exception.UnauthorizedException;
import com.skillsync.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private NotificationService notificationService;

    private Notification notification;

    @BeforeEach
    void setUp() {
        notification = new Notification();
        notification.setId(1L);
        notification.setUserId(10L);
        notification.setType("SESSION_REQUESTED");
        notification.setMessage("You have a new session request");
        notification.setIsRead(false);
        notification.setSentAt(LocalDateTime.now());
    }

    // ─── getUserNotifications ────────────────────────────────────────────────

    @Test
    void getUserNotifications_shouldReturnList_whenNotificationsExist() {
        when(notificationRepository.findByUserId(10L)).thenReturn(List.of(notification));

        List<Notification> result = notificationService.getUserNotifications(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(10L);
    }

    @Test
    void getUserNotifications_shouldReturnEmptyList_whenNoNotifications() {
        when(notificationRepository.findByUserId(10L)).thenReturn(List.of());

        List<Notification> result = notificationService.getUserNotifications(10L);

        assertThat(result).isEmpty();
    }

    // ─── getUserUnreadNotifications ──────────────────────────────────────────

    @Test
    void getUserUnreadNotifications_shouldReturnUnreadOnly() {
        when(notificationRepository.findUnreadByUserId(10L)).thenReturn(List.of(notification));

        List<Notification> result = notificationService.getUserUnreadNotifications(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getIsRead()).isFalse();
    }

    @Test
    void getUserUnreadNotifications_shouldReturnEmpty_whenAllRead() {
        when(notificationRepository.findUnreadByUserId(10L)).thenReturn(List.of());

        List<Notification> result = notificationService.getUserUnreadNotifications(10L);

        assertThat(result).isEmpty();
    }

    // ─── getUnreadCount ──────────────────────────────────────────────────────

    @Test
    void getUnreadCount_shouldReturnCount() {
        when(notificationRepository.countUnreadByUserId(10L)).thenReturn(5);

        Integer count = notificationService.getUnreadCount(10L);

        assertThat(count).isEqualTo(5);
    }

    @Test
    void getUnreadCount_shouldReturnZero_whenNoUnread() {
        when(notificationRepository.countUnreadByUserId(10L)).thenReturn(0);

        Integer count = notificationService.getUnreadCount(10L);

        assertThat(count).isEqualTo(0);
    }

    // ─── markAsRead ──────────────────────────────────────────────────────────

    @Test
    void markAsRead_shouldMarkNotificationRead_whenOwner() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any())).thenReturn(notification);

        notificationService.markAsRead(1L, 10L);

        assertThat(notification.getIsRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_shouldThrow_whenNotificationNotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(99L, 10L))
                .isInstanceOf(NotificationNotFoundException.class);
    }

    @Test
    void markAsRead_shouldThrow_whenNotOwner() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> notificationService.markAsRead(1L, 99L))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("own notifications");
    }

    // ─── deleteNotification ──────────────────────────────────────────────────

    @Test
    void deleteNotification_shouldDelete_whenOwner() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        notificationService.deleteNotification(1L, 10L);

        verify(notificationRepository).delete(notification);
    }

    @Test
    void deleteNotification_shouldThrow_whenNotificationNotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.deleteNotification(99L, 10L))
                .isInstanceOf(NotificationNotFoundException.class);
    }

    @Test
    void deleteNotification_shouldThrow_whenNotOwner() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> notificationService.deleteNotification(1L, 99L))
                .isInstanceOf(UnauthorizedException.class);

        verify(notificationRepository, never()).delete(any());
    }
}

package com.skillsync.notification.service.command;

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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationCommandServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private NotificationCommandService notificationCommandService;

    private Notification notification;

    @BeforeEach
    void setUp() {
        notification = new Notification();
        notification.setId(1L);
        notification.setUserId(10L);
        notification.setRead(false);
    }

    @Test
    void markAsRead_shouldSucceed_whenOwner() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        
        notificationCommandService.markAsRead(1L, 10L);

        assertThat(notification.getRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_shouldThrow_whenNotOwner() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        
        assertThatThrownBy(() -> notificationCommandService.markAsRead(1L, 99L))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void markAsRead_shouldThrow_whenNotFound() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> notificationCommandService.markAsRead(1L, 10L))
                .isInstanceOf(NotificationNotFoundException.class);
    }

    @Test
    void deleteNotification_shouldSucceed_whenOwner() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        
        notificationCommandService.deleteNotification(1L, 10L);

        verify(notificationRepository).delete(notification);
    }
}

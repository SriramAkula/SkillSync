package com.skillsync.notification.service;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.service.command.NotificationCommandService;
import com.skillsync.notification.service.query.NotificationQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.skillsync.notification.dto.response.PageResponse;
import com.skillsync.notification.dto.NotificationDto;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationCommandService notificationCommandService;
    private final NotificationQueryService notificationQueryService;

    public PageResponse<NotificationDto> getUserNotifications(Long userId, int page, int size) {
        return notificationQueryService.getUserNotifications(userId, page, size);
    }

    public PageResponse<NotificationDto> getUserUnreadNotifications(Long userId, int page, int size) {
        return notificationQueryService.getUserUnreadNotifications(userId, page, size);
    }

    public Integer getUnreadCount(Long userId) {
        return notificationQueryService.getUnreadCount(userId);
    }

    public void markAsRead(Long notificationId, Long userId) {
        notificationCommandService.markAsRead(notificationId, userId);
    }

    public void deleteNotification(Long notificationId, Long userId) {
        notificationCommandService.deleteNotification(notificationId, userId);
    }
}

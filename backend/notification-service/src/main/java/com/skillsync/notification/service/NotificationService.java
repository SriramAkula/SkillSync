package com.skillsync.notification.service;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.service.command.NotificationCommandService;
import com.skillsync.notification.service.query.NotificationQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationCommandService notificationCommandService;
    private final NotificationQueryService notificationQueryService;

    public List<Notification> getUserNotifications(Long userId) {
        return notificationQueryService.getUserNotifications(userId);
    }

    public List<Notification> getUserUnreadNotifications(Long userId) {
        return notificationQueryService.getUserUnreadNotifications(userId);
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

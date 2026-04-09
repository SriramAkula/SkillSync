package com.skillsync.notification.service.command;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.exception.NotificationNotFoundException;
import com.skillsync.notification.exception.UnauthorizedException;
import com.skillsync.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationCommandService {

    private final NotificationRepository notificationRepository;

    @Transactional
    @CacheEvict(value = "notification", allEntries = true)
    public void markAsRead(Long notificationId, Long userId) {
        log.info("Marking notification {} as read for user {}", notificationId, userId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException("You can only read your own notifications");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    @CacheEvict(value = "notification", allEntries = true)
    public void deleteNotification(Long notificationId, Long userId) {
        log.info("Deleting notification {} for user {}", notificationId, userId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException("You can only delete your own notifications");
        }
        notificationRepository.delete(notification);
    }
}

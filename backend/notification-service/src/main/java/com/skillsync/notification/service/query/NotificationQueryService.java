package com.skillsync.notification.service.query;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationQueryService {

    private final NotificationRepository notificationRepository;

    @Cacheable(value = "notification", key = "'all_' + #userId")
    public List<Notification> getUserNotifications(Long userId) {
        log.info("Cache MISS - fetching all notifications for user {}", userId);
        return notificationRepository.findByUserId(userId);
    }

    @Cacheable(value = "notification", key = "'unread_' + #userId")
    public List<Notification> getUserUnreadNotifications(Long userId) {
        log.info("Cache MISS - fetching unread notifications for user {}", userId);
        return notificationRepository.findUnreadByUserId(userId);
    }

    @Cacheable(value = "notification", key = "'count_' + #userId")
    public Integer getUnreadCount(Long userId) {
        log.info("Cache MISS - getting unread count for user {}", userId);
        return notificationRepository.countUnreadByUserId(userId);
    }
}

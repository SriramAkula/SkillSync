package com.skillsync.notification.service;

import com.skillsync.notification.dto.NotificationDto;
import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.exception.NotificationNotFoundException;
import com.skillsync.notification.exception.UnauthorizedException;
import com.skillsync.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {
    
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    public List<Notification> getUserNotifications(Long userId) {
        log.info("Fetching all notifications for user {}", userId);
        return notificationRepository.findByUserId(userId);
    }
    
    public List<Notification> getUserUnreadNotifications(Long userId) {
        log.info("Fetching unread notifications for user {}", userId);
        return notificationRepository.findUnreadByUserId(userId);
    }
    
    public Integer getUnreadCount(Long userId) {
        log.info("Getting unread notification count for user {}", userId);
        return notificationRepository.countUnreadByUserId(userId);
    }
    
    @Transactional
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

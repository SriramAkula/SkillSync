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

    public com.skillsync.notification.dto.response.PageResponse<com.skillsync.notification.dto.NotificationDto> getUserNotifications(Long userId, int page, int size) {
        log.info("Fetching paginated notifications for user {}, page={}, size={}", userId, page, size);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<Notification> notificationPage = notificationRepository.findByUserId(userId, pageable);
        
        return com.skillsync.notification.dto.response.PageResponse.<com.skillsync.notification.dto.NotificationDto>builder()
                .content(notificationPage.getContent().stream()
                        .map(com.skillsync.notification.dto.NotificationDto::fromEntity)
                        .collect(java.util.stream.Collectors.toList()))
                .currentPage(notificationPage.getNumber())
                .totalElements(notificationPage.getTotalElements())
                .totalPages(notificationPage.getTotalPages())
                .pageSize(notificationPage.getSize())
                .build();
    }

    public com.skillsync.notification.dto.response.PageResponse<com.skillsync.notification.dto.NotificationDto> getUserUnreadNotifications(Long userId, int page, int size) {
        log.info("Fetching paginated unread notifications for user {}, page={}, size={}", userId, page, size);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<Notification> notificationPage = notificationRepository.findUnreadByUserId(userId, pageable);
        
        return com.skillsync.notification.dto.response.PageResponse.<com.skillsync.notification.dto.NotificationDto>builder()
                .content(notificationPage.getContent().stream()
                        .map(com.skillsync.notification.dto.NotificationDto::fromEntity)
                        .collect(java.util.stream.Collectors.toList()))
                .currentPage(notificationPage.getNumber())
                .totalElements(notificationPage.getTotalElements())
                .totalPages(notificationPage.getTotalPages())
                .pageSize(notificationPage.getSize())
                .build();
    }

    @Cacheable(value = "notification", key = "'count_' + #userId")
    public Integer getUnreadCount(Long userId) {
        log.info("Cache MISS - getting unread count for user {}", userId);
        return notificationRepository.countUnreadByUserId(userId);
    }
}

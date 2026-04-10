package com.skillsync.notification.repository;

import com.skillsync.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId")
    org.springframework.data.domain.Page<Notification> findByUserId(Long userId, org.springframework.data.domain.Pageable pageable);
    
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.read = false")
    org.springframework.data.domain.Page<Notification> findUnreadByUserId(Long userId, org.springframework.data.domain.Pageable pageable);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.read = false")
    Integer countUnreadByUserId(Long userId);
}

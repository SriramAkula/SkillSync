package com.skillsync.notification.repository;

import com.skillsync.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId ORDER BY n.sentAt DESC")
    List<Notification> findByUserId(Long userId);
    
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.read = false ORDER BY n.sentAt DESC")
    List<Notification> findUnreadByUserId(Long userId);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.read = false")
    Integer countUnreadByUserId(Long userId);
}

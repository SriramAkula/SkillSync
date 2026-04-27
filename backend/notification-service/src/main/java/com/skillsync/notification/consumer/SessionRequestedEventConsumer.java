package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.SessionRequestedEvent;
import com.skillsync.notification.repository.NotificationRepository;
import com.skillsync.notification.service.EmailService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;

@Component
@Slf4j
@RequiredArgsConstructor
public class SessionRequestedEventConsumer {
    
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    
    @RabbitListener(queues = "session.requested.queue")
    public void handleSessionRequested(SessionRequestedEvent event) {
        log.info("Received SESSION_REQUESTED event for session {}", event.getSessionId());
        
        try {
            // Save notification to database
            Notification notification = new Notification();
            notification.setUserId(event.getMentorId());
            notification.setType("SESSION_REQUESTED");
            notification.setMessage("You have a new session request scheduled for " + event.getScheduledAt());
            notification.setRead(false);
            notification.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
            // Send email
            emailService.sendSessionRequestEmail(event);
            
            log.info("Session requested notification processed for mentor {}", event.getMentorId());
        } catch (Exception e) {
            log.error("Error processing session requested event: {}", e.getMessage());
        }
    }
}

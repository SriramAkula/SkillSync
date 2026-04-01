package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.SessionRequestedEvent;
import com.skillsync.notification.repository.NotificationRepository;
import com.skillsync.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class SessionRequestedEventConsumer {
    
    private static final Logger log = LoggerFactory.getLogger(SessionRequestedEventConsumer.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private EmailService emailService;
    
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
            notification.setSentAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
            // Send email
            emailService.sendSessionRequestEmail(event);
            
            log.info("Session requested notification processed for mentor {}", event.getMentorId());
        } catch (Exception e) {
            log.error("Error processing session requested event: {}", e.getMessage());
        }
    }
}

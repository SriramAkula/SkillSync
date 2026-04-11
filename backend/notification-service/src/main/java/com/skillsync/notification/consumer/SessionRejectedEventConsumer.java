package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.SessionRejectedEvent;
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
public class SessionRejectedEventConsumer {
    
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    
    @RabbitListener(queues = "session.rejected.queue")
    public void handleSessionRejected(SessionRejectedEvent event) {
        log.info("Received SESSION_REJECTED event for session {}", event.getSessionId());
        
        try {
            // Save notification to learner's inbox
            Notification notification = new Notification();
            notification.setUserId(event.getLearnerId());
            notification.setType("SESSION_REJECTED");
            notification.setMessage("Your session request has been rejected. Reason: " + event.getRejectionReason());
            notification.setRead(false);
            notification.setSentAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
            // Send email to learner
            try {
                emailService.sendSessionRejectedEmail(event);
            } catch (Exception e) {
                log.warn("Failed to send email for session rejected: {}", e.getMessage());
            }
            
            log.info("Session rejected notification processed for learner {}", event.getLearnerId());
        } catch (Exception e) {
            log.error("Error processing session rejected event: {}", e.getMessage());
        }
    }
}

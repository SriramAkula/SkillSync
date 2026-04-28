package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.SessionAcceptedEvent;
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
public class SessionAcceptedEventConsumer {
    
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    
    @RabbitListener(queues = "session.accepted.queue")
    public void handleSessionAccepted(SessionAcceptedEvent event) {
        log.info("Received SESSION_ACCEPTED event for session {}", event.getSessionId());
        
        try {
            // Save notification to learner's inbox
            Notification notification = new Notification();
            notification.setUserId(event.getLearnerId());
            notification.setType("SESSION_ACCEPTED");
            notification.setMessage("Your session request has been accepted by the mentor!");
            notification.setRead(false);
            notification.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
            // Send email to learner
            try {
                emailService.sendSessionAcceptedEmail(event);
            } catch (Exception e) {
                log.warn("Failed to send email for session accepted: {}", e.getMessage());
            }
            
            log.info("Session accepted notification processed for learner {}", event.getLearnerId());
        } catch (Exception e) {
            log.error("Error processing session accepted event: {}", e.getMessage());
        }
    }
}

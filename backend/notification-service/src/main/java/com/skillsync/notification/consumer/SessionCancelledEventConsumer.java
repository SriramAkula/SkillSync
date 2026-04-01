package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.SessionCancelledEvent;
import com.skillsync.notification.repository.NotificationRepository;
import com.skillsync.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class SessionCancelledEventConsumer {
    
    private static final Logger log = LoggerFactory.getLogger(SessionCancelledEventConsumer.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private EmailService emailService;
    
    @RabbitListener(queues = "session.cancelled.queue")
    public void handleSessionCancelled(SessionCancelledEvent event) {
        log.info("Received SESSION_CANCELLED event for session {}", event.getSessionId());
        
        try {
            // Save notification to both mentor and learner
            // Notification to mentor
            Notification mentorNotification = new Notification();
            mentorNotification.setUserId(event.getMentorId());
            mentorNotification.setType("SESSION_CANCELLED");
            mentorNotification.setMessage("A session has been cancelled.");
            mentorNotification.setRead(false);
            mentorNotification.setSentAt(LocalDateTime.now());
            notificationRepository.save(mentorNotification);
            
            // Notification to learner
            Notification learnerNotification = new Notification();
            learnerNotification.setUserId(event.getLearnerId());
            learnerNotification.setType("SESSION_CANCELLED");
            learnerNotification.setMessage("Your session has been cancelled.");
            learnerNotification.setRead(false);
            learnerNotification.setSentAt(LocalDateTime.now());
            notificationRepository.save(learnerNotification);
            
            // Send email to both
            try {
                emailService.sendSessionCancelledEmail(event);
            } catch (Exception e) {
                log.warn("Failed to send email for session cancelled: {}", e.getMessage());
            }
            
            log.info("Session cancelled notification processed for mentor {} and learner {}", 
                event.getMentorId(), event.getLearnerId());
        } catch (Exception e) {
            log.error("Error processing session cancelled event: {}", e.getMessage());
        }
    }
}

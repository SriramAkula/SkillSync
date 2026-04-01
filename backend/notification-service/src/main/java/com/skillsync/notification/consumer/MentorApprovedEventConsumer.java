package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.MentorApprovedEvent;
import com.skillsync.notification.repository.NotificationRepository;
import com.skillsync.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class MentorApprovedEventConsumer {
    
    private static final Logger log = LoggerFactory.getLogger(MentorApprovedEventConsumer.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private EmailService emailService;
    
    @RabbitListener(queues = "mentor.approved.queue")
    public void handleMentorApproved(MentorApprovedEvent event) {
        log.info("Received MENTOR_APPROVED event for mentor {}", event.getMentorId());
        
        try {
            // Save notification
            Notification notification = new Notification();
            notification.setUserId(event.getUserId());
            notification.setType("MENTOR_APPROVED");
            notification.setMessage("Congratulations! Your mentor application has been approved.");
            notification.setRead(false);
            notification.setSentAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
            // Send email
            emailService.sendMentorApprovedEmail(event);
            
            log.info("Mentor approved notification processed for user {}", event.getUserId());
        } catch (Exception e) {
            log.error("Error processing mentor approved event: {}", e.getMessage());
        }
    }
}

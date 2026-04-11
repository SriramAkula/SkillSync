package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.MentorApprovedEvent;
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
public class MentorApprovedEventConsumer {
    
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    
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

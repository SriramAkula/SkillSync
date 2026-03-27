package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.ReviewSubmittedEvent;
import com.skillsync.notification.repository.NotificationRepository;
import com.skillsync.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class ReviewSubmittedEventConsumer {
    
    private static final Logger log = LoggerFactory.getLogger(ReviewSubmittedEventConsumer.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private EmailService emailService;
    
    @RabbitListener(queues = "review.submitted.queue")
    public void handleReviewSubmitted(ReviewSubmittedEvent event) {
        log.info("Received REVIEW_SUBMITTED event for review {}", event.getReviewId());
        
        try {
            // Save notification
            Notification notification = new Notification();
            notification.setUserId(event.getMentorId());
            notification.setType("REVIEW_SUBMITTED");
            notification.setMessage("You received a new " + event.getRating() + "-star review");
            notification.setRead(false);
            notification.setSentAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
            // Send email
            emailService.sendReviewNotificationEmail(event);
            
            log.info("Review submitted notification processed for mentor {}", event.getMentorId());
        } catch (Exception e) {
            log.error("Error processing review submitted event: {}", e.getMessage());
        }
    }
}

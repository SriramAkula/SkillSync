package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.ReviewSubmittedEvent;
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
public class ReviewSubmittedEventConsumer {
    
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    
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

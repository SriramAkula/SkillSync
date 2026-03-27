package com.skillsync.notification.consumer;

import com.skillsync.notification.event.ReviewSubmittedEvent;
import com.skillsync.notification.repository.NotificationRepository;
import com.skillsync.notification.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewSubmittedEventConsumerTest {
    
    @Mock
    private NotificationRepository notificationRepository;
    
    @Mock
    private EmailService emailService;
    
    @InjectMocks
    private ReviewSubmittedEventConsumer consumer;
    
    private ReviewSubmittedEvent event;
    
    @BeforeEach
    void setUp() {
        event = new ReviewSubmittedEvent();
        event.setReviewId(1L);
        event.setMentorId(1L);
        event.setLearnerId(2L);
        event.setRating(5);
        event.setComment("Great mentor!");
    }
    
    @Test
    void testHandleReviewSubmitted() {
        consumer.handleReviewSubmitted(event);
        
        verify(notificationRepository).save(any());
        verify(emailService).sendReviewNotificationEmail(any());
    }
}

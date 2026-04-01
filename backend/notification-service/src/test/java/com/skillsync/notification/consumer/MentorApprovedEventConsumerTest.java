package com.skillsync.notification.consumer;

import com.skillsync.notification.event.MentorApprovedEvent;
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
class MentorApprovedEventConsumerTest {
    
    @Mock
    private NotificationRepository notificationRepository;
    
    @Mock
    private EmailService emailService;
    
    @InjectMocks
    private MentorApprovedEventConsumer consumer;
    
    private MentorApprovedEvent event;
    
    @BeforeEach
    void setUp() {
        event = new MentorApprovedEvent();
        event.setMentorId(1L);
        event.setUserId(1L);
        event.setMentorName("John Doe");
    }
    
    @Test
    void testHandleMentorApproved() {
        consumer.handleMentorApproved(event);
        
        verify(notificationRepository).save(any());
        verify(emailService).sendMentorApprovedEmail(any());
    }
}

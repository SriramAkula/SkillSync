package com.skillsync.notification.consumer;

import com.skillsync.notification.event.SessionRequestedEvent;
import com.skillsync.notification.repository.NotificationRepository;
import com.skillsync.notification.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionRequestedEventConsumerTest {
    
    @Mock
    private NotificationRepository notificationRepository;
    
    @Mock
    private EmailService emailService;
    
    @InjectMocks
    private SessionRequestedEventConsumer consumer;
    
    private SessionRequestedEvent event;
    
    @BeforeEach
    void setUp() {
        event = new SessionRequestedEvent();
        event.setSessionId(1L);
        event.setMentorId(1L);
        event.setLearnerId(2L);
        event.setScheduledAt(LocalDateTime.now().plusDays(1));
        event.setDurationMinutes(60);
    }
    
    @Test
    void testHandleSessionRequested() {
        consumer.handleSessionRequested(event);
        
        verify(notificationRepository).save(any());
        verify(emailService).sendSessionRequestEmail(any());
    }
}

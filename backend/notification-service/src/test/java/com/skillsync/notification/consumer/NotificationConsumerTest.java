package com.skillsync.notification.consumer;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.event.*;
import com.skillsync.notification.repository.NotificationRepository;
import com.skillsync.notification.service.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationConsumerTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private EmailService emailService;

    @InjectMocks private MentorApprovedEventConsumer mentorApprovedConsumer;
    @InjectMocks private ReviewSubmittedEventConsumer reviewSubmittedConsumer;
    @InjectMocks private SessionAcceptedEventConsumer sessionAcceptedConsumer;
    @InjectMocks private SessionCancelledEventConsumer sessionCancelledConsumer;
    @InjectMocks private SessionRejectedEventConsumer sessionRejectedConsumer;
    @InjectMocks private SessionRequestedEventConsumer sessionRequestedConsumer;

    @Test
    void handleMentorApproved_shouldSaveAndEmail() {
        MentorApprovedEvent event = new MentorApprovedEvent();
        event.setUserId(1L);
        mentorApprovedConsumer.handleMentorApproved(event);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendMentorApprovedEmail(event);
    }

    @Test
    void handleReviewSubmitted_shouldSaveAndEmail() {
        ReviewSubmittedEvent event = new ReviewSubmittedEvent();
        event.setMentorId(1L);
        reviewSubmittedConsumer.handleReviewSubmitted(event);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendReviewNotificationEmail(event);
    }

    @Test
    void handleSessionAccepted_shouldSaveAndEmail() {
        SessionAcceptedEvent event = new SessionAcceptedEvent();
        event.setLearnerId(1L);
        sessionAcceptedConsumer.handleSessionAccepted(event);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendSessionAcceptedEmail(event);
    }

    @Test
    void handleSessionCancelled_shouldSaveAndEmail() {
        SessionCancelledEvent event = new SessionCancelledEvent();
        event.setMentorId(1L);
        event.setLearnerId(2L);
        sessionCancelledConsumer.handleSessionCancelled(event);
        verify(notificationRepository, times(2)).save(any(Notification.class));
        verify(emailService).sendSessionCancelledEmail(event);
    }

    @Test
    void handleSessionCancelled_shouldHandleEmailError() {
        SessionCancelledEvent event = new SessionCancelledEvent();
        event.setMentorId(1L);
        event.setLearnerId(2L);
        doThrow(new RuntimeException("Email error")).when(emailService).sendSessionCancelledEmail(event);
        
        sessionCancelledConsumer.handleSessionCancelled(event);
        
        verify(notificationRepository, times(2)).save(any(Notification.class));
        // Should not throw exception upstream
    }

    @Test
    void handleSessionRejected_shouldSaveAndEmail() {
        SessionRejectedEvent event = new SessionRejectedEvent();
        event.setLearnerId(1L);
        sessionRejectedConsumer.handleSessionRejected(event);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendSessionRejectedEmail(event);
    }

    @Test
    void handleSessionRequested_shouldSaveAndEmail() {
        SessionRequestedEvent event = new SessionRequestedEvent();
        event.setMentorId(1L);
        event.setScheduledAt(LocalDateTime.now());
        sessionRequestedConsumer.handleSessionRequested(event);
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendSessionRequestEmail(event);
    }

    @Test
    void handleSessionRequested_shouldHandleGeneralError() {
        when(notificationRepository.save(any())).thenThrow(new RuntimeException("DB Error"));
        assertDoesNotThrow(() -> sessionRequestedConsumer.handleSessionRequested(new SessionRequestedEvent()));
    }

    @Test
    void handleSessionRejected_shouldHandleGeneralError() {
        when(notificationRepository.save(any())).thenThrow(new RuntimeException("DB Error"));
        assertDoesNotThrow(() -> sessionRejectedConsumer.handleSessionRejected(new SessionRejectedEvent()));
    }

    @Test
    void handleSessionAccepted_shouldHandleGeneralError() {
        when(notificationRepository.save(any())).thenThrow(new RuntimeException("DB Error"));
        assertDoesNotThrow(() -> sessionAcceptedConsumer.handleSessionAccepted(new SessionAcceptedEvent()));
    }

    @Test
    void handleMentorApproved_shouldHandleGeneralError() {
        when(notificationRepository.save(any())).thenThrow(new RuntimeException("DB Error"));
        assertDoesNotThrow(() -> mentorApprovedConsumer.handleMentorApproved(new MentorApprovedEvent()));
    }

    @Test
    void handleReviewSubmitted_shouldHandleGeneralError() {
        when(notificationRepository.save(any())).thenThrow(new RuntimeException("DB Error"));
        assertDoesNotThrow(() -> reviewSubmittedConsumer.handleReviewSubmitted(new ReviewSubmittedEvent()));
    }

    @Test
    void handleSessionCancelled_shouldHandleGeneralError() {
        when(notificationRepository.save(any())).thenThrow(new RuntimeException("DB Error"));
        assertDoesNotThrow(() -> sessionCancelledConsumer.handleSessionCancelled(new SessionCancelledEvent()));
    }

    @Test
    void handleSessionRejected_shouldHandleEmailError() {
        SessionRejectedEvent event = new SessionRejectedEvent();
        doThrow(new RuntimeException("Email error")).when(emailService).sendSessionRejectedEmail(any());
        assertDoesNotThrow(() -> sessionRejectedConsumer.handleSessionRejected(event));
    }
}

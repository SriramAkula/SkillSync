package com.skillsync.notification.service;

import com.skillsync.notification.client.MentorProfileData;
import com.skillsync.notification.client.MentorProfileResponse;
import com.skillsync.notification.client.MentorServiceClient;
import com.skillsync.notification.client.UserServiceClient;
import com.skillsync.notification.dto.UserDTO;
import com.skillsync.notification.dto.UserProfileResponse;
import com.skillsync.notification.event.*;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock private JavaMailSender mailSender;
    @Mock private TemplateEngine templateEngine;
    @Mock private UserServiceClient userServiceClient;
    @Mock private MentorServiceClient mentorServiceClient;
    @Mock private MimeMessage mimeMessage;

    @InjectMocks private EmailService emailService;

    private UserDTO userDTO;
    private UserProfileResponse userResponse;
    private MentorProfileResponse mentorResponse;

    @BeforeEach
    void setUp() {
        userDTO = new UserDTO();
        userDTO.setEmail("test@example.com");
        
        userResponse = new UserProfileResponse();
        userResponse.setData(userDTO);

        MentorProfileData mentorDTO = new MentorProfileData();
        mentorDTO.setUserId(2L);
        mentorResponse = new MentorProfileResponse();
        mentorResponse.setData(mentorDTO);

        lenient().when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void sendSessionRequestEmail_shouldSucceed() {
        when(mentorServiceClient.getMentorbyId(1L)).thenReturn(mentorResponse);
        when(userServiceClient.getUserById(2L)).thenReturn(userResponse);
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html></html>");

        SessionRequestedEvent event = new SessionRequestedEvent();
        event.setMentorId(1L);
        event.setScheduledAt(LocalDateTime.now());
        event.setDurationMinutes(60);

        emailService.sendSessionRequestEmail(event);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendMentorApprovedEmail_shouldSucceed() {
        when(userServiceClient.getUserById(10L)).thenReturn(userResponse);
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html></html>");

        MentorApprovedEvent event = new MentorApprovedEvent();
        event.setUserId(10L);

        emailService.sendMentorApprovedEmail(event);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendReviewNotificationEmail_shouldSucceed() {
        when(mentorServiceClient.getMentorbyId(1L)).thenReturn(mentorResponse);
        when(userServiceClient.getUserById(2L)).thenReturn(userResponse);
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html></html>");

        ReviewSubmittedEvent event = new ReviewSubmittedEvent();
        event.setMentorId(1L);
        event.setRating(5);
        event.setComment("Great!");

        emailService.sendReviewNotificationEmail(event);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendSessionAcceptedEmail_shouldSucceed() {
        when(userServiceClient.getUserById(10L)).thenReturn(userResponse);
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html></html>");

        SessionAcceptedEvent event = new SessionAcceptedEvent();
        event.setLearnerId(10L);

        emailService.sendSessionAcceptedEmail(event);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendSessionRejectedEmail_shouldSucceed() {
        when(userServiceClient.getUserById(10L)).thenReturn(userResponse);
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html></html>");

        SessionRejectedEvent event = new SessionRejectedEvent();
        event.setLearnerId(10L);
        event.setRejectionReason("Busy");

        emailService.sendSessionRejectedEmail(event);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendSessionCancelledEmail_shouldSucceed() {
        when(userServiceClient.getUserById(1L)).thenReturn(userResponse);
        when(userServiceClient.getUserById(2L)).thenReturn(userResponse);
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html></html>");

        SessionCancelledEvent event = new SessionCancelledEvent();
        event.setMentorId(1L);
        event.setLearnerId(2L);

        emailService.sendSessionCancelledEmail(event);

        verify(mailSender, times(2)).send(any(MimeMessage.class));
    }

    // ─── Error Scenarios ──────────────────────────────────────────────────────

    @Test
    void sendHtmlEmail_shouldHandleMessagingException() throws Exception {
        when(userServiceClient.getUserById(anyLong())).thenReturn(userResponse);
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html></html>");
        doThrow(new org.springframework.mail.MailSendException("error")).when(mailSender).send(any(MimeMessage.class));

        MentorApprovedEvent event = new MentorApprovedEvent();
        event.setUserId(1L);

        emailService.sendMentorApprovedEmail(event);
        // Verified by log (no assertion possible easily, but hits the catch block)
    }

    @Test
    void sendSessionRequestEmail_shouldReturnEarly_whenMentorResponseIsNull() {
        when(mentorServiceClient.getMentorbyId(1L)).thenReturn(null);
        SessionRequestedEvent event = new SessionRequestedEvent();
        event.setMentorId(1L);
        emailService.sendSessionRequestEmail(event);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendSessionRequestEmail_shouldReturnEarly_whenMentorDataIsNull() {
        MentorProfileResponse res = new MentorProfileResponse();
        res.setData(null);
        when(mentorServiceClient.getMentorbyId(1L)).thenReturn(res);
        SessionRequestedEvent event = new SessionRequestedEvent();
        event.setMentorId(1L);
        emailService.sendSessionRequestEmail(event);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendSessionRequestEmail_shouldReturnEarly_whenMentorUserIdIsNull() {
        MentorProfileResponse res = new MentorProfileResponse();
        res.setData(new MentorProfileData()); // userId is null
        when(mentorServiceClient.getMentorbyId(1L)).thenReturn(res);
        SessionRequestedEvent event = new SessionRequestedEvent();
        event.setMentorId(1L);
        emailService.sendSessionRequestEmail(event);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void getEmailForUser_shouldReturnNull_whenResponseIsNull() {
        when(userServiceClient.getUserById(anyLong())).thenReturn(null);
        MentorApprovedEvent event = new MentorApprovedEvent();
        event.setUserId(1L);
        emailService.sendMentorApprovedEmail(event);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void getEmailForUser_shouldReturnNull_whenDataIsNull() {
        UserProfileResponse res = new UserProfileResponse();
        res.setData(null);
        when(userServiceClient.getUserById(anyLong())).thenReturn(res);
        MentorApprovedEvent event = new MentorApprovedEvent();
        event.setUserId(1L);
        emailService.sendMentorApprovedEmail(event);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void getEmailForUser_shouldReturnNull_whenEmailIsEmpty() {
        UserDTO user = new UserDTO();
        user.setEmail("");
        UserProfileResponse res = new UserProfileResponse();
        res.setData(user);
        when(userServiceClient.getUserById(anyLong())).thenReturn(res);
        MentorApprovedEvent event = new MentorApprovedEvent();
        event.setUserId(1L);
        emailService.sendMentorApprovedEmail(event);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}

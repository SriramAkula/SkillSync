package com.skillsync.notification.service;

import com.skillsync.notification.client.UserServiceClient;
import com.skillsync.notification.client.MentorServiceClient;
import com.skillsync.notification.client.MentorProfileResponse;
import com.skillsync.notification.dto.UserDTO;
import com.skillsync.notification.event.SessionRequestedEvent;
import com.skillsync.notification.event.SessionAcceptedEvent;
import com.skillsync.notification.event.SessionRejectedEvent;
import com.skillsync.notification.event.SessionCancelledEvent;
import com.skillsync.notification.event.MentorApprovedEvent;
import com.skillsync.notification.event.ReviewSubmittedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private TemplateEngine templateEngine;
    
    @Autowired
    private UserServiceClient userServiceClient;
    
    @Autowired
    private MentorServiceClient mentorServiceClient;

    private void sendHtmlEmail(String to, String subject, String templateName, Context context) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            // Set the main layout template and the content fragment
            context.setVariable("template", templateName);
            String htmlContent = templateEngine.process("base-layout", context);
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(mimeMessage);
            log.info("HTML email '{}' sent successfully to {}", subject, to);
        } catch (MessagingException e) {
            log.error("Failed to send HTML email {}: {}", subject, e.getMessage());
        }
    }
    
    /**
     * Fetch email for a regular user (learner, admin, or any non-mentor context)
     */
    private String getEmailForUser(Long userId) {
        try {
            var response = userServiceClient.getUserById(userId);
            if (response != null && response.getData() != null) {
                UserDTO user = response.getData();
                if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                    return user.getEmail();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch email for user {}: {}", userId, e.getMessage());
        }
        return null;
    }
    
    /**
     * Fetch email for a mentor by mentorId
     * Workflow: mentorId -> fetch mentor profile -> extract userId -> fetch user email
     */
    private String getEmailForMentor(Long mentorId) {
        try {
            // Step 1: Fetch mentor profile by mentorId to get userId
            MentorProfileResponse mentorResponse = mentorServiceClient.getMentorbyId(mentorId);
            if (mentorResponse == null || mentorResponse.getData() == null) {
                log.warn("Mentor profile not found for mentorId: {}", mentorId);
                return null;
            }
            
            Long userId = mentorResponse.getData().getUserId();
            if (userId == null) {
                log.warn("userId is null in mentor profile for mentorId: {}", mentorId);
                return null;
            }
            
            // Step 2: Fetch email using userId
            return getEmailForUser(userId);
            
        } catch (Exception e) {
            log.warn("Failed to fetch email for mentor {}: {}", mentorId, e.getMessage());
        }
        return null;
    }
    
    public void sendSessionRequestEmail(SessionRequestedEvent event) {
        try {
            String mentorEmail = getEmailForMentor(event.getMentorId());
            if (mentorEmail == null) return;
            
            Context context = new Context();
            context.setVariable("mentorName", "Mentor"); // Could fetch actual name if needed
            context.setVariable("learnerName", "a student");
            context.setVariable("scheduledAt", event.getScheduledAt());
            context.setVariable("durationMinutes", event.getDurationMinutes());
            
            sendHtmlEmail(mentorEmail, "New Session Request - SkillSync", "session-request", context);
        } catch (Exception e) {
            log.error("Failed to send session request email: {}", e.getMessage());
        }
    }
    
    public void sendMentorApprovedEmail(MentorApprovedEvent event) {
        try {
            String userEmail = getEmailForUser(event.getUserId());
            if (userEmail == null) return;
            
            Context context = new Context();
            context.setVariable("userName", "Mentor");
            
            sendHtmlEmail(userEmail, "Your Mentor Application is Approved! - SkillSync", "mentor-approved", context);
        } catch (Exception e) {
            log.error("Failed to send mentor approved email: {}", e.getMessage());
        }
    }
    
    public void sendReviewNotificationEmail(ReviewSubmittedEvent event) {
        try {
            String mentorEmail = getEmailForMentor(event.getMentorId());
            if (mentorEmail == null) return;
            
            Context context = new Context();
            context.setVariable("mentorName", "Mentor");
            context.setVariable("rating", event.getRating());
            context.setVariable("comment", event.getComment());
            
            sendHtmlEmail(mentorEmail, "New Review Received - SkillSync", "review-notification", context);
        } catch (Exception e) {
            log.error("Failed to send review notification email: {}", e.getMessage());
        }
    }
    
    public void sendSessionAcceptedEmail(SessionAcceptedEvent event) {
        try {
            String learnerEmail = getEmailForUser(event.getLearnerId());
            if (learnerEmail == null) return;
            
            Context context = new Context();
            context.setVariable("learnerName", "Student");
            
            sendHtmlEmail(learnerEmail, "Your Session has been Accepted! - SkillSync", "session-accepted", context);
        } catch (Exception e) {
            log.error("Failed to send session accepted email: {}", e.getMessage());
        }
    }
    
    public void sendSessionRejectedEmail(SessionRejectedEvent event) {
        try {
            String learnerEmail = getEmailForUser(event.getLearnerId());
            if (learnerEmail == null) return;
            
            Context context = new Context();
            context.setVariable("learnerName", "Student");
            context.setVariable("reason", event.getRejectionReason());
            
            sendHtmlEmail(learnerEmail, "Update on Your Session Request - SkillSync", "session-rejected", context);
        } catch (Exception e) {
            log.error("Failed to send session rejected email: {}", e.getMessage());
        }
    }
    
    public void sendSessionCancelledEmail(SessionCancelledEvent event) {
        try {
            String mentorEmail = getEmailForUser(event.getMentorId());
            String learnerEmail = getEmailForUser(event.getLearnerId());
            
            if (mentorEmail == null && learnerEmail == null) return;
            
            Context context = new Context();

            if (mentorEmail != null) {
                context.setVariable("userName", "Mentor");
                sendHtmlEmail(mentorEmail, "Session Cancellation Notification - SkillSync", "session-cancelled", context);
            }
            
            if (learnerEmail != null) {
                context.setVariable("userName", "Learner");
                sendHtmlEmail(learnerEmail, "Session Cancellation Notification - SkillSync", "session-cancelled", context);
            }
        } catch (Exception e) {
            log.error("Failed to send session cancelled email: {}", e.getMessage());
        }
    }
}

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
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private UserServiceClient userServiceClient;
    
    @Autowired
    private MentorServiceClient mentorServiceClient;
    
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
            // Use mentor service to fetch mentor email
            String mentorEmail = getEmailForMentor(event.getMentorId());
            if (mentorEmail == null) {
                log.warn("No email found for mentor {}", event.getMentorId());
                return;
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(mentorEmail);
            message.setSubject("New Session Request");
            message.setText("You have received a new session request scheduled for " + event.getScheduledAt() + 
                           " for " + event.getDurationMinutes() + " minutes.");
            
            mailSender.send(message);
            
            log.info("Session request email sent to mentor {} ({})", event.getMentorId(), mentorEmail);
        } catch (Exception e) {
            log.error("Failed to send session request email: {}", e.getMessage());
        }
    }
    
    public void sendMentorApprovedEmail(MentorApprovedEvent event) {
        try {
            String userEmail = getEmailForUser(event.getUserId());
            if (userEmail == null) {
                log.warn("No email found for user {}", event.getUserId());
                return;
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(userEmail);
            message.setSubject("Mentor Application Approved");
            message.setText("Congratulations! Your mentor application has been approved. You can now start accepting sessions.");
            
            mailSender.send(message);
            
            log.info("Mentor approved email sent to user {} ({})", event.getUserId(), userEmail);
        } catch (Exception e) {
            log.error("Failed to send mentor approved email: {}", e.getMessage());
        }
    }
    
    public void sendReviewNotificationEmail(ReviewSubmittedEvent event) {
        try {
            // Use mentor service to fetch mentor email
            String mentorEmail = getEmailForMentor(event.getMentorId());
            if (mentorEmail == null) {
                log.warn("No email found for mentor {}", event.getMentorId());
                return;
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(mentorEmail);
            message.setSubject("New Review Received - " + event.getRating() + " Stars");
            message.setText("You received a new " + event.getRating() + "-star review.\n\nComment: " + event.getComment());
            
            mailSender.send(message);
            
            log.info("Review notification email sent to mentor {} ({})", event.getMentorId(), mentorEmail);
        } catch (Exception e) {
            log.error("Failed to send review notification email: {}", e.getMessage());
        }
    }
    
    public void sendSessionAcceptedEmail(SessionAcceptedEvent event) {
        try {
            String learnerEmail = getEmailForUser(event.getLearnerId());
            if (learnerEmail == null) {
                log.warn("No email found for learner {}", event.getLearnerId());
                return;
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(learnerEmail);
            message.setSubject("Your Session Has Been Accepted!");
            message.setText("Good news! The mentor has accepted your session request. Your session is now confirmed.");
            
            mailSender.send(message);
            
            log.info("Session accepted email sent to learner {} ({})", event.getLearnerId(), learnerEmail);
        } catch (Exception e) {
            log.error("Failed to send session accepted email: {}", e.getMessage());
        }
    }
    
    public void sendSessionRejectedEmail(SessionRejectedEvent event) {
        try {
            String learnerEmail = getEmailForUser(event.getLearnerId());
            if (learnerEmail == null) {
                log.warn("No email found for learner {}", event.getLearnerId());
                return;
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(learnerEmail);
            message.setSubject("Your Session Request Was Rejected");
            message.setText("Unfortunately, your session request was rejected.\n\nReason: " + event.getRejectionReason() + 
                           "\n\nPlease try requesting another session with this or another mentor.");
            
            mailSender.send(message);
            
            log.info("Session rejected email sent to learner {} ({})", event.getLearnerId(), learnerEmail);
        } catch (Exception e) {
            log.error("Failed to send session rejected email: {}", e.getMessage());
        }
    }
    
    public void sendSessionCancelledEmail(SessionCancelledEvent event) {
        try {
            String mentorEmail = getEmailForUser(event.getMentorId());
            String learnerEmail = getEmailForUser(event.getLearnerId());
            
            if (mentorEmail == null && learnerEmail == null) {
                log.warn("No emails found for mentor {} or learner {}", event.getMentorId(), event.getLearnerId());
                return;
            }
            
            // Email to mentor
            if (mentorEmail != null) {
                SimpleMailMessage mentorMessage = new SimpleMailMessage();
                mentorMessage.setTo(mentorEmail);
                mentorMessage.setSubject("A Scheduled Session Has Been Cancelled");
                mentorMessage.setText("A session you agreed to has been cancelled.");
                
                mailSender.send(mentorMessage);
                log.info("Session cancelled email sent to mentor {} ({})", event.getMentorId(), mentorEmail);
            }
            
            // Email to learner
            if (learnerEmail != null) {
                SimpleMailMessage learnerMessage = new SimpleMailMessage();
                learnerMessage.setTo(learnerEmail);
                learnerMessage.setSubject("Your Session Has Been Cancelled");
                learnerMessage.setText("Your scheduled session has been cancelled. Please book another session if needed.");
                
                mailSender.send(learnerMessage);
                log.info("Session cancelled email sent to learner {} ({})", event.getLearnerId(), learnerEmail);
            }
        } catch (Exception e) {
            log.error("Failed to send session cancelled email: {}", e.getMessage());
        }
    }
}

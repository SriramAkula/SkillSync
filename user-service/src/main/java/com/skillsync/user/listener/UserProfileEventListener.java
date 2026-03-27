package com.skillsync.user.listener;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.skillsync.user.config.RabbitMQConfig;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.event.UserCreatedEvent;
import com.skillsync.user.event.UserUpdatedEvent;
import com.skillsync.user.repository.UserProfileRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Event Listener for User Service
 * Consumes user lifecycle events from Auth Service to sync UserProfile
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserProfileEventListener {

    private final UserProfileRepository userProfileRepository;

    /**
     * Listen to UserCreatedEvent from Auth Service
     * Creates a new UserProfile when a user is registered
     */
    @RabbitListener(queues = RabbitMQConfig.USER_CREATED_QUEUE)
    @Transactional
    public void handleUserCreated(UserCreatedEvent event) {
        try {
            log.info("Received UserCreatedEvent for userId: {}, email: {}", event.getUserId(), event.getEmail());

            // Check if UserProfile already exists
            if (userProfileRepository.findByUserId(event.getUserId()).isPresent()) {
                log.warn("UserProfile already exists for userId: {}", event.getUserId());
                return;
            }

            // Create new UserProfile from event
            UserProfile userProfile = new UserProfile();
            userProfile.setUserId(event.getUserId());
            userProfile.setEmail(event.getEmail());
            userProfile.setName(event.getName());  // Can be null initially - to be filled when user updates profile
            userProfile.setProfileComplete(false);  // Profile is not complete until user adds name and skills
            userProfile.setRating(0.0);
            userProfile.setTotalReviews(0);

            UserProfile savedProfile = userProfileRepository.save(userProfile);
            log.info("UserProfile created successfully for userId: {}", savedProfile.getUserId());

        } catch (Exception e) {
            log.error("Error handling UserCreatedEvent for userId: {}", event.getUserId(), e);
            throw new RuntimeException("Failed to process user creation event", e);
        }
    }

    /**
     * Listen to UserUpdatedEvent from Auth Service
     * Updates the corresponding UserProfile when user details change
     */
    @RabbitListener(queues = RabbitMQConfig.USER_UPDATED_QUEUE)
    @Transactional
    public void handleUserUpdated(UserUpdatedEvent event) {
        try {
            log.info("Received UserUpdatedEvent for userId: {}, email: {}", event.getUserId(), event.getEmail());

            // Find UserProfile by userId
            UserProfile userProfile = userProfileRepository.findByUserId(event.getUserId())
                    .orElseThrow(() -> new RuntimeException(
                            "UserProfile not found for userId: " + event.getUserId()
                    ));

            // Update profile fields from event
            userProfile.setName(event.getName());
            userProfile.setEmail(event.getEmail());

            UserProfile updatedProfile = userProfileRepository.save(userProfile);
            log.info("UserProfile updated successfully for userId: {}", updatedProfile.getUserId());

        } catch (Exception e) {
            log.error("Error handling UserUpdatedEvent for userId: {}", event.getUserId(), e);
            throw new RuntimeException("Failed to process user update event", e);
        }
    }
}

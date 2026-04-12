package com.skillsync.user.listener;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.event.UserCreatedEvent;
import com.skillsync.user.event.UserUpdatedEvent;
import com.skillsync.user.repository.UserProfileRepository;

@ExtendWith(MockitoExtension.class)
class UserProfileEventListenerTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private UserProfileEventListener listener;

    private UserCreatedEvent createdEvent;
    private UserUpdatedEvent updatedEvent;

    @BeforeEach
    void setUp() {
        createdEvent = new UserCreatedEvent(1L, "test@example.com", "Test User", "testuser", "ROLE_LEARNER", 12345L);
        updatedEvent = new UserUpdatedEvent(1L, "updated@example.com", "Updated User", "updateduser", "ROLE_LEARNER", true, 67890L);
    }

    @Test
    void handleUserCreated_ShouldCreateProfile_WhenNotExists() {
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(new UserProfile());

        listener.handleUserCreated(createdEvent);

        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    void handleUserCreated_ShouldNotCreateProfile_WhenExists() {
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(new UserProfile()));

        listener.handleUserCreated(createdEvent);

        verify(userProfileRepository, never()).save(any(UserProfile.class));
    }

    @Test
    void handleUserCreated_ShouldThrowException_OnError() {
        when(userProfileRepository.findByUserId(1L)).thenThrow(new RuntimeException("DB Error"));

        assertThrows(RuntimeException.class, () -> listener.handleUserCreated(createdEvent));
    }

    @Test
    void handleUserUpdated_ShouldUpdateProfile_WhenExists() {
        UserProfile profile = new UserProfile();
        profile.setUserId(1L);
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);

        listener.handleUserUpdated(updatedEvent);

        verify(userProfileRepository).save(profile);
    }

    @Test
    void handleUserUpdated_ShouldThrowException_WhenNotExists() {
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> listener.handleUserUpdated(updatedEvent));
    }

    @Test
    void handleUserUpdated_ShouldThrowException_OnError() {
        when(userProfileRepository.findByUserId(1L)).thenThrow(new RuntimeException("DB Error"));

        assertThrows(RuntimeException.class, () -> listener.handleUserUpdated(updatedEvent));
    }
}

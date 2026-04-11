package com.skillsync.user.service.command;

import com.skillsync.user.client.AuthClient;
import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.mapper.UserProfileMapper;
import com.skillsync.user.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileCommandServiceTest {

    @Mock private UserProfileRepository userProfileRepository;
    @Mock private UserProfileMapper userProfileMapper;
    @Mock private AuthClient authClient;
    @InjectMocks private UserProfileCommandService userProfileCommandService;

    private UserProfile profile;

    @BeforeEach
    void setUp() {
        profile = new UserProfile();
        profile.setId(1L);
        profile.setUserId(10L);
        profile.setEmail("user@example.com");
        profile.setName("John Doe");
        profile.setUsername("user");
    }

    @Test
    void updateProfile_shouldReturnUpdatedDto_whenProfileExists() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jdoe", "Jane Doe", "New bio", "9876543210", "Python,Django");
        UserProfileResponseDto dto = new UserProfileResponseDto();
        
        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);
        when(userProfileMapper.toDto(profile)).thenReturn(dto);

        UserProfileResponseDto result = userProfileCommandService.updateProfile(10L, request);

        assertThat(result).isNotNull();
        verify(userProfileRepository).save(profile);
    }

    @Test
    void updateProfile_shouldSyncWithAuth_whenUsernameChanges() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("newuser", "Name", "Bio", "123", "Java");
        UserProfileResponseDto dto = new UserProfileResponseDto();
        
        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);
        when(userProfileMapper.toDto(profile)).thenReturn(dto);

        userProfileCommandService.updateProfile(10L, request);

        verify(authClient).updateUserProfile(eq(10L), any());
    }

    @Test
    void updateProfile_shouldThrow_whenProfileNotFound() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jane", "Jane", "bio", "1234567890", "Java");
        when(userProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userProfileCommandService.updateProfile(99L, request))
                .isInstanceOf(UserProfileNotFoundException.class);
    }

    @Test
    void createProfile_shouldSaveNewProfile() {
        userProfileCommandService.createProfile(10L, "user@example.com", "user");
        verify(userProfileRepository).save(any());
    }

    @Test
    void updateProfile_shouldNotThrow_whenAuthClientFails() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("newuser", "Name", "Bio", "123", "Java");
        UserProfileResponseDto dto = new UserProfileResponseDto();
        
        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);
        when(userProfileMapper.toDto(profile)).thenReturn(dto);
        doThrow(new RuntimeException("Auth service down")).when(authClient).updateUserProfile(anyLong(), any());

        // Should not throw exception, just log error
        assertThatCode(() -> userProfileCommandService.updateProfile(10L, request))
                .doesNotThrowAnyException();
        
        verify(userProfileRepository).save(profile);
    }
}

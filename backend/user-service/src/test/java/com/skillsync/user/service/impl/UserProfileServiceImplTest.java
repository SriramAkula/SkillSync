package com.skillsync.user.service.impl;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.repository.UserProfileRepository;
import com.skillsync.user.mapper.UserProfileMapper;
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
class UserProfileServiceImplTest {

    @Mock private UserProfileRepository userProfileRepository;
    @Mock private UserProfileMapper userProfileMapper;
    @InjectMocks private UserProfileServiceImpl userProfileService;

    private UserProfile profile;

    @BeforeEach
    void setUp() {
        profile = new UserProfile();
        profile.setId(1L);
        profile.setUserId(10L);
        profile.setEmail("user@example.com");
        profile.setName("John Doe");
        profile.setBio("Developer");
        profile.setPhoneNumber("1234567890");
        profile.setSkills("Java,Spring");
        profile.setRating(4.5);
        profile.setTotalReviews(10);
        profile.setProfileComplete(true);
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());
    }

    // ─── getProfileByUserId ──────────────────────────────────────────────────

    @Test
    void getProfileByUserId_shouldReturnDto_whenProfileExists() {
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setUserId(10L);
        dto.setEmail("user@example.com");
        dto.setName("John Doe");

        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(userProfileMapper.toDto(profile)).thenReturn(dto);

        UserProfileResponseDto result = userProfileService.getProfileByUserId(10L);

        assertThat(result.getUserId()).isEqualTo(10L);
        assertThat(result.getEmail()).isEqualTo("user@example.com");
        assertThat(result.getName()).isEqualTo("John Doe");
    }

    @Test
    void getProfileByUserId_shouldThrow_whenProfileNotFound() {
        when(userProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userProfileService.getProfileByUserId(99L))
                .isInstanceOf(UserProfileNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── updateProfile ───────────────────────────────────────────────────────

    @Test
    void updateProfile_shouldReturnUpdatedDto_whenProfileExists() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jdoe", "Jane Doe", "New bio", "9876543210", "Python,Django");
        UserProfileResponseDto dto = new UserProfileResponseDto();
        
        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);
        when(userProfileMapper.toDto(profile)).thenReturn(dto);

        UserProfileResponseDto result = userProfileService.updateProfile(10L, request);

        assertThat(result).isNotNull();
        verify(userProfileRepository).save(profile);
    }

    @Test
    void updateProfile_shouldSetProfileComplete_whenNameAndSkillsPresent() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jane", "Jane", "bio", "1234567890", "Java");
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setIsProfileComplete(true);

        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userProfileMapper.toDto(any())).thenReturn(dto);

        UserProfileResponseDto result = userProfileService.updateProfile(10L, request);

        assertThat(result.getIsProfileComplete()).isTrue();
    }

    @Test
    void updateProfile_shouldSetProfileIncomplete_whenSkillsNull() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jane", "Jane", "bio", "1234567890", null);
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setIsProfileComplete(false);

        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userProfileMapper.toDto(any())).thenReturn(dto);

        UserProfileResponseDto result = userProfileService.updateProfile(10L, request);

        assertThat(result.getIsProfileComplete()).isFalse();
    }

    @Test
    void updateProfile_shouldSetProfileIncomplete_whenSkillsEmpty() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jane", "Jane", "bio", "1234567890", "");
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setIsProfileComplete(false);

        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userProfileMapper.toDto(any())).thenReturn(dto);

        UserProfileResponseDto result = userProfileService.updateProfile(10L, request);

        assertThat(result.getIsProfileComplete()).isFalse();
    }

    @Test
    void updateProfile_shouldThrow_whenProfileNotFound() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jane", "Jane", "bio", "1234567890", "Java");
        when(userProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userProfileService.updateProfile(99L, request))
                .isInstanceOf(UserProfileNotFoundException.class);
    }

    // ─── createProfile ───────────────────────────────────────────────────────

    @Test
    void createProfile_shouldSaveNewProfile() {
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);

        userProfileService.createProfile(10L, "user@example.com", "user");

        verify(userProfileRepository).save(argThat(p ->
                p.getUserId().equals(10L) &&
                p.getEmail().equals("user@example.com") &&
                !p.getProfileComplete()
        ));
    }

    @Test
    void createProfile_shouldSetDefaultValues() {
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        userProfileService.createProfile(5L, "new@example.com", "new");

        verify(userProfileRepository).save(argThat(p ->
                p.getRating().equals(0.0) &&
                p.getTotalReviews().equals(0) &&
                !p.getProfileComplete()
        ));
    }

    // ─── getProfileByEmail ───────────────────────────────────────────────────

    @Test
    void getProfileByEmail_shouldReturnDto_whenProfileExists() {
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setEmail("user@example.com");

        when(userProfileRepository.findByEmail("user@example.com")).thenReturn(Optional.of(profile));
        when(userProfileMapper.toDto(profile)).thenReturn(dto);

        UserProfileResponseDto result = userProfileService.getProfileByEmail("user@example.com");

        assertThat(result.getEmail()).isEqualTo("user@example.com");
    }

    @Test
    void getProfileByEmail_shouldThrow_whenProfileNotFound() {
        when(userProfileRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userProfileService.getProfileByEmail("ghost@example.com"))
                .isInstanceOf(UserProfileNotFoundException.class)
                .hasMessageContaining("ghost@example.com");
    }
}

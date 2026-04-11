package com.skillsync.user.service.query;

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

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileQueryServiceTest {

    @Mock private UserProfileRepository userProfileRepository;
    @Mock private UserProfileMapper userProfileMapper;
    @InjectMocks private UserProfileQueryService userProfileQueryService;

    private UserProfile profile;

    @BeforeEach
    void setUp() {
        profile = new UserProfile();
        profile.setId(1L);
        profile.setUserId(10L);
        profile.setEmail("user@example.com");
    }

    @Test
    void getProfileByUserId_shouldReturnDto_whenProfileExists() {
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setUserId(10L);

        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(userProfileMapper.toDto(profile)).thenReturn(dto);

        UserProfileResponseDto result = userProfileQueryService.getProfileByUserId(10L);

        assertThat(result.getUserId()).isEqualTo(10L);
    }

    @Test
    void getProfileByUserId_shouldThrow_whenProfileNotFound() {
        when(userProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userProfileQueryService.getProfileByUserId(99L))
                .isInstanceOf(UserProfileNotFoundException.class);
    }

    @Test
    void getProfileByEmail_shouldReturnDto_whenProfileExists() {
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setEmail("user@example.com");

        when(userProfileRepository.findByEmail("user@example.com")).thenReturn(Optional.of(profile));
        when(userProfileMapper.toDto(profile)).thenReturn(dto);

        UserProfileResponseDto result = userProfileQueryService.getProfileByEmail("user@example.com");

        assertThat(result.getEmail()).isEqualTo("user@example.com");
    }
}

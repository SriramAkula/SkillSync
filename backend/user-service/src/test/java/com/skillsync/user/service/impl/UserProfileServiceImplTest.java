package com.skillsync.user.service.impl;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.service.command.UserProfileCommandService;
import com.skillsync.user.service.query.UserProfileQueryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceImplTest {

    @Mock private UserProfileCommandService commandService;
    @Mock private UserProfileQueryService queryService;

    @InjectMocks private UserProfileServiceImpl userProfileService;

    @Test
    void getProfileByUserId_shouldDelegateToQueryService() {
        UserProfileResponseDto dto = new UserProfileResponseDto();
        when(queryService.getProfileByUserId(anyLong())).thenReturn(dto);

        UserProfileResponseDto result = userProfileService.getProfileByUserId(1L);

        assertThat(result).isEqualTo(dto);
        verify(queryService).getProfileByUserId(1L);
    }

    @Test
    void getProfileByEmail_shouldDelegateToQueryService() {
        UserProfileResponseDto dto = new UserProfileResponseDto();
        when(queryService.getProfileByEmail(anyString())).thenReturn(dto);

        UserProfileResponseDto result = userProfileService.getProfileByEmail("test@example.com");

        assertThat(result).isEqualTo(dto);
        verify(queryService).getProfileByEmail("test@example.com");
    }

    @Test
    void updateProfile_shouldDelegateToCommandService() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("user", "Name", "Bio", "123", "Java");
        UserProfileResponseDto dto = new UserProfileResponseDto();
        when(commandService.updateProfile(anyLong(), any())).thenReturn(dto);

        UserProfileResponseDto result = userProfileService.updateProfile(1L, request);

        assertThat(result).isEqualTo(dto);
        verify(commandService).updateProfile(1L, request);
    }

    @Test
    void createProfile_shouldDelegateToCommandService() {
        userProfileService.createProfile(1L, "email", "username");
        verify(commandService).createProfile(1L, "email", "username");
    }
}

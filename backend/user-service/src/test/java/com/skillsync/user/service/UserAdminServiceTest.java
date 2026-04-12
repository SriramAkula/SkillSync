package com.skillsync.user.service;

import com.skillsync.user.client.AuthClient;
import com.skillsync.user.dto.response.UserProfileAdminResponseDto;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAdminServiceTest {

    @Mock private UserProfileRepository userProfileRepository;
    @Mock private UserProfileMapper userProfileMapper;
    @Mock private AuthClient authClient;

    @InjectMocks private UserAdminService userAdminService;

    private UserProfile userProfile;
    private UserProfileAdminResponseDto adminResponseDto;

    @BeforeEach
    void setUp() {
        userProfile = new UserProfile();
        userProfile.setUserId(1L);
        userProfile.setEmail("test@example.com");
        userProfile.setIsBlocked(false);

        adminResponseDto = new UserProfileAdminResponseDto();
        adminResponseDto.setUserId(1L);
        adminResponseDto.setEmail("test@example.com");
    }

    @Test
    void getAllUsers_shouldReturnPagedUsers() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserProfile> page = new PageImpl<>(Collections.singletonList(userProfile));
        
        when(userProfileRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(userProfileMapper.toAdminDto(any(UserProfile.class))).thenReturn(adminResponseDto);

        Page<UserProfileAdminResponseDto> result = userAdminService.getAllUsers(0, 10);

        assertThat(result.getContent()).hasSize(1);
        verify(userProfileRepository).findAll(pageable);
    }

    @Test
    void getBlockedUsers_shouldReturnList() {
        when(userProfileRepository.findByIsBlockedTrue()).thenReturn(Collections.singletonList(userProfile));
        when(userProfileMapper.toAdminDto(any(UserProfile.class))).thenReturn(adminResponseDto);

        List<UserProfileAdminResponseDto> result = userAdminService.getBlockedUsers();

        assertThat(result).hasSize(1);
        verify(userProfileRepository).findByIsBlockedTrue();
    }

    @Test
    void blockUser_shouldSucceed_whenUserExistsAndNotBlocked() {
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(userProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(userProfile);
        when(userProfileMapper.toAdminDto(any(UserProfile.class))).thenReturn(adminResponseDto);

        UserProfileAdminResponseDto result = userAdminService.blockUser(1L, "Reason", 100L);

        assertThat(result).isNotNull();
        assertThat(userProfile.getIsBlocked()).isTrue();
        assertThat(userProfile.getBlockReason()).isEqualTo("Reason");
        assertThat(userProfile.getBlockedBy()).isEqualTo(100L);
        
        verify(authClient).updateUserStatus(1L, false);
    }

    @Test
    void blockUser_shouldReturnEarly_whenAlreadyBlocked() {
        userProfile.setIsBlocked(true);
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(userProfile));
        when(userProfileMapper.toAdminDto(any(UserProfile.class))).thenReturn(adminResponseDto);

        userAdminService.blockUser(1L, "Reason", 100L);

        verify(userProfileRepository, never()).save(any());
        verify(authClient, never()).updateUserStatus(anyLong(), anyBoolean());
    }

    @Test
    void blockUser_shouldHandleAuthClientFailure() {
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(userProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(userProfile);
        when(userProfileMapper.toAdminDto(any(UserProfile.class))).thenReturn(adminResponseDto);
        doThrow(new RuntimeException("Auth error")).when(authClient).updateUserStatus(anyLong(), anyBoolean());

        // Should not rethrow
        userAdminService.blockUser(1L, "Reason", 100L);

        verify(userProfileRepository).save(any());
    }

    @Test
    void unblockUser_shouldSucceed_whenUserIsBlocked() {
        userProfile.setIsBlocked(true);
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(userProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(userProfile);
        when(userProfileMapper.toAdminDto(any(UserProfile.class))).thenReturn(adminResponseDto);

        UserProfileAdminResponseDto result = userAdminService.unblockUser(1L, 100L);

        assertThat(result).isNotNull();
        assertThat(userProfile.getIsBlocked()).isFalse();
        assertThat(userProfile.getBlockReason()).isNull();
        
        verify(authClient).updateUserStatus(1L, true);
    }

    @Test
    void unblockUser_shouldReturnEarly_whenNotBlocked() {
        userProfile.setIsBlocked(false);
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(userProfile));
        when(userProfileMapper.toAdminDto(any(UserProfile.class))).thenReturn(adminResponseDto);

        userAdminService.unblockUser(1L, 100L);

        verify(userProfileRepository, never()).save(any());
    }

    @Test
    void unblockUser_shouldHandleAuthClientFailure() {
        userProfile.setIsBlocked(true);
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(userProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(userProfile);
        when(userProfileMapper.toAdminDto(any(UserProfile.class))).thenReturn(adminResponseDto);
        doThrow(new RuntimeException("Auth error")).when(authClient).updateUserStatus(anyLong(), anyBoolean());

        // Should not rethrow
        userAdminService.unblockUser(1L, 100L);

        verify(userProfileRepository).save(any());
    }

    @Test
    void getUserDetails_shouldReturnDto() {
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(userProfile));
        when(userProfileMapper.toAdminDto(any(UserProfile.class))).thenReturn(adminResponseDto);

        UserProfileAdminResponseDto result = userAdminService.getUserDetails(1L);

        assertThat(result).isNotNull();
    }

    @Test
    void blockUser_shouldThrow_whenUserNotFound() {
        when(userProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAdminService.blockUser(99L, "Reason", 100L))
                .isInstanceOf(UserProfileNotFoundException.class);
    }
}

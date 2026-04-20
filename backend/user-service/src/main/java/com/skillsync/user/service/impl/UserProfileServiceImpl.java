package com.skillsync.user.service.impl;

import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.service.UserProfileService;
import com.skillsync.user.service.command.UserProfileCommandService;
import com.skillsync.user.service.query.UserProfileQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileCommandService userProfileCommandService;
    private final UserProfileQueryService userProfileQueryService;

    @Override
    public UserProfileResponseDto getProfileByUserId(Long userId) {
        return userProfileQueryService.getProfileByUserId(userId);
    }

    @Override
    public UserProfileResponseDto getProfileByEmail(String email) {
        return userProfileQueryService.getProfileByEmail(email);
    }

    @Override
    public UserProfileResponseDto updateProfile(Long userId, UpdateProfileRequestDto requestDto) {
        return userProfileCommandService.updateProfile(userId, requestDto);
    }

    @Override
    public void createProfile(Long userId, String email, String username) {
        userProfileCommandService.createProfile(userId, email, username);
    }

    @Override
    public void createProfile(Long userId, String email, String username, String name, String role) {
        userProfileCommandService.createProfile(userId, email, username, name, role);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userProfileQueryService.existsByUsername(username);
    }

    @Override
    public UserProfileResponseDto uploadProfileImage(Long userId, org.springframework.web.multipart.MultipartFile file) {
        return userProfileCommandService.uploadProfileImage(userId, file);
    }

    @Override
    public void uploadResume(Long userId, org.springframework.web.multipart.MultipartFile file) {
        userProfileCommandService.uploadResume(userId, file);
    }

    @Override
    public String getResumeUrl(Long userId) {
        return userProfileQueryService.getResumeUrl(userId);
    }
}

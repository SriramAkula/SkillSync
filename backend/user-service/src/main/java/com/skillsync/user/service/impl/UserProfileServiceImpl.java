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
}

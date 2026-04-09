package com.skillsync.user.service.command;

import com.skillsync.user.client.AuthClient;
import com.skillsync.user.dto.internal.AuthProfileUpdateDTO;
import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.mapper.UserProfileMapper;
import com.skillsync.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileCommandService {

    private final UserProfileRepository userProfileRepository;
    private final UserProfileMapper userProfileMapper;
    private final AuthClient authClient;

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "user", key = "'userId_' + #userId"),
        @CacheEvict(value = "user", key = "'email_' + #result.email", condition = "#result != null")
    }, put = {
        @CachePut(value = "user", key = "'userId_' + #userId")
    })
    public UserProfileResponseDto updateProfile(Long userId, UpdateProfileRequestDto requestDto) {
        log.info("Updating profile for userId: {}", userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new UserProfileNotFoundException("User profile not found for userId: " + userId));

        String oldUsername = profile.getUsername();
        userProfileMapper.updateEntity(profile, requestDto);
        UserProfile updated = userProfileRepository.save(profile);

        if (requestDto.getUsername() != null && !requestDto.getUsername().equals(oldUsername)) {
            try {
                log.info("Syncing username change to Auth Service: {} -> {}", oldUsername, requestDto.getUsername());
                authClient.updateUserProfile(userId, new AuthProfileUpdateDTO(requestDto.getUsername()));
            } catch (Exception e) {
                log.error("Failed to sync username with Auth Service for userId {}: {}", userId, e.getMessage());
            }
        }

        log.info("Profile updated successfully for userId: {}", userId);
        return userProfileMapper.toDto(updated);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "user", key = "'userId_' + #userId"),
        @CacheEvict(value = "user", key = "'email_' + #email")
    })
    public void createProfile(Long userId, String email, String username) {
        log.info("Creating profile for userId: {}, email: {}, username: {}", userId, email, username);
        userProfileRepository.save(userProfileMapper.toEntity(userId, email, username));
        log.info("UserProfile created successfully for userId: {}", userId);
    }
}

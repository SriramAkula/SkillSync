package com.skillsync.user.service.command;

import com.skillsync.user.client.AuthClient;
import com.skillsync.user.dto.internal.AuthProfileUpdateDTO;
import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.exception.UsernameAlreadyExistsException;
import com.skillsync.user.mapper.UserProfileMapper;
import com.skillsync.user.repository.UserProfileRepository;
import com.skillsync.user.service.FileStorageService;
import org.springframework.web.multipart.MultipartFile;
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
    private final FileStorageService fileStorageService;

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
        
        // If username is changing, check for uniqueness
        if (requestDto.getUsername() != null && !requestDto.getUsername().equalsIgnoreCase(oldUsername)) {
            if (userProfileRepository.existsByUsernameAndUserIdNot(requestDto.getUsername(), userId)) {
                throw new UsernameAlreadyExistsException("Username '" + requestDto.getUsername() + "' is already taken");
            }
        }

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
        createProfile(userId, email, username, null, "ROLE_LEARNER");
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "user", key = "'userId_' + #userId"),
        @CacheEvict(value = "user", key = "'email_' + #email")
    })
    public void createProfile(Long userId, String email, String username, String name, String role) {
        log.info("Creating profile for userId: {}, email: {}, username: {}, role: {}", userId, email, username, role);
        userProfileRepository.save(userProfileMapper.toEntity(userId, email, username, name, role));
        log.info("UserProfile created successfully for userId: {}", userId);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "user", key = "'userId_' + #userId")
    })
    public UserProfileResponseDto uploadProfileImage(Long userId, MultipartFile file) {
        log.info("Uploading profile image for userId: {}", userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new UserProfileNotFoundException("User profile not found for userId: " + userId));

        String imageUrl = fileStorageService.uploadPublicFile(file, "profile-images/" + userId);
        profile.setProfileImageUrl(imageUrl);
        UserProfile updated = userProfileRepository.save(profile);
        return userProfileMapper.toDto(updated);
    }

    @Transactional
    public void uploadResume(Long userId, MultipartFile file) {
        log.info("Uploading resume for userId: {}", userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new UserProfileNotFoundException("User profile not found for userId: " + userId));

        String resumePath = fileStorageService.uploadPrivateFile(file, "resumes/" + userId);
        profile.setResumeUrl(resumePath);
        userProfileRepository.save(profile);
    }
}

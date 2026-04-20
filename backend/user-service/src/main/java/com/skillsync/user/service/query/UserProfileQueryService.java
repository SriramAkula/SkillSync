package com.skillsync.user.service.query;

import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.mapper.UserProfileMapper;
import com.skillsync.user.repository.UserProfileRepository;
import com.skillsync.user.entity.UserProfile;
import com.skillsync.user.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileQueryService {

    private final UserProfileRepository userProfileRepository;
    private final UserProfileMapper userProfileMapper;
    private final FileStorageService fileStorageService;

    @Cacheable(value = "user", key = "'userId_' + #userId")
    public UserProfileResponseDto getProfileByUserId(Long userId) {
        log.info("Cache MISS - fetching profile for userId={} from DB", userId);
        return userProfileRepository.findByUserId(userId)
                .map(userProfileMapper::toDto)
                .orElseThrow(() -> new UserProfileNotFoundException("User profile not found for userId: " + userId));
    }

    @Cacheable(value = "user", key = "'email_' + #email")
    public UserProfileResponseDto getProfileByEmail(String email) {
        log.info("Cache MISS - fetching profile for email={} from DB", email);
        return userProfileRepository.findByEmail(email)
                .map(userProfileMapper::toDto)
                .orElseThrow(() -> new UserProfileNotFoundException("User profile not found for email: " + email));
    }

    public boolean existsByUsername(String username) {
        return userProfileRepository.existsByUsername(username);
    }

    public String getResumeUrl(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new UserProfileNotFoundException("User profile not found for userId: " + userId));

        if (profile.getResumeUrl() == null || profile.getResumeUrl().isEmpty()) {
            return null;
        }

        // Generate a pre-signed URL valid for 60 minutes
        return fileStorageService.getPrivateFileUrl(profile.getResumeUrl(), 60);
    }
}

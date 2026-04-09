package com.skillsync.user.service.query;

import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.mapper.UserProfileMapper;
import com.skillsync.user.repository.UserProfileRepository;
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

    @Cacheable(value = "user", key = "'userId_' + #userId")
    public UserProfileResponseDto getProfileByUserId(Long userId) {
        log.info("Cache MISS - fetching profile for userId={} from DB", userId);
        return userProfileRepository.findByUserId(userId)
                .map(userProfileMapper::toDto)
                .orElseGet(() -> {
                    log.warn("User profile not found for userId: {}. Returning default placeholder.", userId);
                    String name = (userId == 1) ? "Admin" : "User " + userId;
                    String email = (userId == 1) ? "admin@skillsync.com" : "user" + userId + "@skillsync.com";
                    UserProfileResponseDto placeholder = new UserProfileResponseDto();
                    placeholder.setUserId(userId);
                    placeholder.setUsername(name);
                    placeholder.setName(name);
                    placeholder.setEmail(email);
                    placeholder.setBio("I am a " + name + " in SkillSync");
                    return placeholder;
                });
    }

    @Cacheable(value = "user", key = "'email_' + #email")
    public UserProfileResponseDto getProfileByEmail(String email) {
        log.info("Cache MISS - fetching profile for email={} from DB", email);
        return userProfileRepository.findByEmail(email)
                .map(userProfileMapper::toDto)
                .orElseThrow(() -> new UserProfileNotFoundException("User profile not found for email: " + email));
    }
}

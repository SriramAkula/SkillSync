package com.skillsync.mentor.service;

import org.springframework.data.redis.core.RedisTemplate;
import com.skillsync.mentor.client.AuthServiceClient;
import com.skillsync.mentor.dto.request.ApplyMentorRequestDto;
import com.skillsync.mentor.dto.request.UpdateAvailabilityRequestDto;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.entity.AvailabilityStatus;
import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.entity.MentorStatus;
import com.skillsync.mentor.exception.MentorAlreadyExistsException;
import com.skillsync.mentor.exception.MentorNotFoundException;
import com.skillsync.mentor.mapper.MentorMapper;
import com.skillsync.mentor.repository.MentorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class MentorCommandService {

    private static final String CACHE_PREFIX = "mentor:";
    private static final long CACHE_TTL_MINUTES = 60;

    private final MentorRepository mentorRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AuthServiceClient authServiceClient;
    private final MentorMapper mentorMapper;

    @Transactional
    public MentorProfileResponseDto applyAsMentor(Long userId, ApplyMentorRequestDto request) {
        log.info("User {} applying as mentor", userId);
        if (mentorRepository.existsByUserId(userId)) {
            throw new MentorAlreadyExistsException("User has already applied as a mentor");
        }
        MentorProfile saved = mentorRepository.save(mentorMapper.toEntity(userId, request));
        MentorProfileResponseDto response = mentorMapper.toDto(saved);
        updateCache(saved.getId(), response);
        log.info("Mentor application submitted for userId: {}, mentorId: {}", userId, saved.getId());
        return response;
    }

    @Transactional
    public MentorProfileResponseDto approveMentor(Long mentorId, Long adminId) {
        log.info("Admin {} approving mentor {}", adminId, mentorId);
        MentorProfile profile = findOrThrow(mentorId);
        profile.setStatus(MentorStatus.APPROVED);
        profile.setIsApproved(true);
        profile.setApprovedBy(adminId);
        profile.setApprovalDate(LocalDateTime.now());
        try {
            authServiceClient.addUserRole(profile.getUserId(), "ROLE_MENTOR");
        } catch (Exception e) {
            log.warn("Failed to update role via Feign for userId {}: {}", profile.getUserId(), e.getMessage());
        }
        MentorProfileResponseDto response = mentorMapper.toDto(mentorRepository.save(profile));
        updateCache(mentorId, response);
        return response;
    }

    @Transactional
    public MentorProfileResponseDto rejectMentor(Long mentorId, Long adminId) {
        log.info("Admin {} rejecting mentor {}", adminId, mentorId);
        MentorProfile profile = findOrThrow(mentorId);
        profile.setStatus(MentorStatus.REJECTED);
        profile.setIsApproved(false);
        profile.setApprovedBy(adminId);
        MentorProfileResponseDto response = mentorMapper.toDto(mentorRepository.save(profile));
        updateCache(mentorId, response);
        return response;
    }

    @Transactional
    public MentorProfileResponseDto suspendMentor(Long mentorId, Long adminId) {
        log.info("Admin {} suspending mentor {}", adminId, mentorId);
        MentorProfile profile = findOrThrow(mentorId);
        profile.setStatus(MentorStatus.SUSPENDED);
        profile.setIsApproved(false);
        MentorProfileResponseDto response = mentorMapper.toDto(mentorRepository.save(profile));
        updateCache(mentorId, response);
        return response;
    }

    @Transactional
    public MentorProfileResponseDto updateAvailability(Long userId, UpdateAvailabilityRequestDto request) {
        log.info("Updating availability for userId: {}", userId);
        MentorProfile profile = mentorRepository.findByUserId(userId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor profile not found for userId: " + userId));
        profile.setAvailabilityStatus(AvailabilityStatus.valueOf(request.getAvailabilityStatus()));
        MentorProfileResponseDto response = mentorMapper.toDto(mentorRepository.save(profile));
        updateCache(profile.getId(), response);
        return response;
    }

    @Transactional
    public void updateMentorRating(Long mentorId, Double newRating) {
        log.info("Updating rating for mentorId: {} to {}", mentorId, newRating);
        MentorProfile profile = findOrThrow(mentorId);
        profile.setRating(newRating);
        MentorProfileResponseDto response = mentorMapper.toDto(mentorRepository.save(profile));
        updateCache(mentorId, response);
    }

    private void updateCache(Long mentorId, MentorProfileResponseDto response) {
        try {
            String key = CACHE_PREFIX + mentorId;
            redisTemplate.opsForValue().set(key, response, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            log.debug("Cache updated for key={}", key);
        } catch (Exception e) {
            log.warn("Failed to update cache for mentorId={}: {}", mentorId, e.getMessage());
        }
    }

    void evictCache(Long mentorId) {
        try {
            String key = CACHE_PREFIX + mentorId;
            redisTemplate.delete(key);
            log.debug("Cache evicted for key={}", key);
        } catch (Exception e) {
            log.warn("Failed to evict cache for mentorId={}: {}", mentorId, e.getMessage());
        }
    }

    private MentorProfile findOrThrow(Long mentorId) {
        return mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));
    }
}



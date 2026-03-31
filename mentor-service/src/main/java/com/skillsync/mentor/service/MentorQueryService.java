package com.skillsync.mentor.service;

import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.exception.MentorNotFoundException;
import com.skillsync.mentor.mapper.MentorMapper;
import com.skillsync.mentor.repository.MentorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class MentorQueryService {

    private static final Logger log = LoggerFactory.getLogger(MentorQueryService.class);
    private static final String CACHE_PREFIX = "mentor:";
    private static final long CACHE_TTL_MINUTES = 60;

    private final MentorRepository mentorRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final MentorMapper mentorMapper;

    public MentorQueryService(MentorRepository mentorRepository,
                              RedisTemplate<String, Object> redisTemplate,
                              MentorMapper mentorMapper) {
        this.mentorRepository = mentorRepository;
        this.redisTemplate = redisTemplate;
        this.mentorMapper = mentorMapper;
    }

    public MentorProfileResponseDto getMentorById(Long mentorId) {
        String key = CACHE_PREFIX + mentorId;
        MentorProfileResponseDto cached = getFromCache(key);
        if (cached != null) {
            log.info("Cache HIT for key={}", key);
            return cached;
        }
        log.info("Cache MISS for key={}", key);
        MentorProfile profile = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));
        MentorProfileResponseDto response = mentorMapper.toDto(profile);
        storeInCache(key, response);
        return response;
    }

    public MentorProfileResponseDto getMentorByUserId(Long userId) {
        String key = CACHE_PREFIX + "user:" + userId;
        MentorProfileResponseDto cached = getFromCache(key);
        if (cached != null) {
            log.info("Cache HIT for key={}", key);
            return cached;
        }
        log.info("Cache MISS for key={}", key);
        MentorProfile profile = mentorRepository.findByUserId(userId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor profile not found for userId: " + userId));
        MentorProfileResponseDto response = mentorMapper.toDto(profile);
        storeInCache(key, response);
        return response;
    }

    public List<MentorProfileResponseDto> getAllApprovedMentors() {
        log.info("Fetching all approved mentors from DB");
        return mentorRepository.findAllApprovedMentors()
                .stream().map(mentorMapper::toDto).collect(Collectors.toList());
    }

    public List<MentorProfileResponseDto> getPendingApplications() {
        log.info("Fetching pending mentor applications from DB");
        return mentorRepository.findPendingApplications()
                .stream().map(mentorMapper::toDto).collect(Collectors.toList());
    }

    public List<MentorProfileResponseDto> searchMentorsBySpecialization(String skill) {
        log.info("Searching mentors by specialization: {}", skill);
        return mentorRepository.searchBySpecialization(skill)
                .stream().map(mentorMapper::toDto).collect(Collectors.toList());
    }

    private MentorProfileResponseDto getFromCache(String key) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value instanceof MentorProfileResponseDto) {
                return (MentorProfileResponseDto) value;
            }
        } catch (Exception e) {
            log.warn("Cache read failed for key={}: {}", key, e.getMessage());
        }
        return null;
    }

    private void storeInCache(String key, MentorProfileResponseDto response) {
        try {
            redisTemplate.opsForValue().set(key, response, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            log.debug("Stored in cache for key={}", key);
        } catch (Exception e) {
            log.warn("Cache write failed for key={}: {}", key, e.getMessage());
        }
    }
}

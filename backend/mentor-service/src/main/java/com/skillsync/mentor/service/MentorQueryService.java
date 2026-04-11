package com.skillsync.mentor.service;

import com.skillsync.mentor.dto.PageResponse;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.exception.MentorNotFoundException;
import com.skillsync.mentor.mapper.MentorMapper;
import com.skillsync.mentor.repository.MentorRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class MentorQueryService {

    private static final String CACHE_PREFIX = "mentor:";
    private static final long CACHE_TTL_MINUTES = 60;

    private final MentorRepository mentorRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final MentorMapper mentorMapper;

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

    public PageResponse<MentorProfileResponseDto> getAllApprovedMentors(int page, int size) {
        log.info("Fetching all approved mentors from DB - page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<MentorProfile> mentorPage = mentorRepository.findAllApprovedMentors(pageable);
        return toPageResponse(mentorPage);
    }

    public PageResponse<MentorProfileResponseDto> getPendingApplications(int page, int size) {
        log.info("Fetching pending mentor applications from DB - page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<MentorProfile> mentorPage = mentorRepository.findPendingApplications(pageable);
        return toPageResponse(mentorPage);
    }

    private PageResponse<MentorProfileResponseDto> toPageResponse(Page<MentorProfile> page) {
        List<MentorProfileResponseDto> content = page.getContent().stream()
                .map(mentorMapper::toDto)
                .collect(Collectors.toList());

        return PageResponse.<MentorProfileResponseDto>builder()
                .content(content)
                .currentPage(page.getNumber())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .pageSize(page.getSize())
                .build();
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

package com.skillsync.mentor.service.impl;

import com.skillsync.mentor.client.AuthServiceClient;
import com.skillsync.mentor.dto.request.ApplyMentorRequestDto;
import com.skillsync.mentor.dto.request.UpdateAvailabilityRequestDto;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.entity.AvailabilityStatus;
import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.entity.MentorStatus;
import com.skillsync.mentor.exception.MentorAlreadyExistsException;
import com.skillsync.mentor.exception.MentorNotFoundException;
import com.skillsync.mentor.repository.MentorRepository;
import com.skillsync.mentor.service.MentorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.skillsync.mentor.audit.AuditService;
import com.skillsync.mentor.event.MentorApprovedEvent;
import com.skillsync.mentor.mapper.MentorMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@Service
@CacheConfig(cacheNames = "mentor")
public class MentorServiceImpl implements MentorService {

    private static final Logger log = LoggerFactory.getLogger(MentorServiceImpl.class);

    private final MentorRepository mentorRepository;
    private final AuthServiceClient authServiceClient;
    private final MentorMapper mentorMapper;
    private final AuditService auditService;
    private final RabbitTemplate rabbitTemplate;

    @Autowired
    public MentorServiceImpl(MentorRepository mentorRepository,
            AuthServiceClient authServiceClient,
            MentorMapper mentorMapper,
            AuditService auditService,
            RabbitTemplate rabbitTemplate) {
        this.mentorRepository = mentorRepository;
        this.authServiceClient = authServiceClient;
        this.mentorMapper = mentorMapper;
        this.auditService = auditService;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public MentorProfileResponseDto applyAsMentor(Long userId, ApplyMentorRequestDto request) {
        log.info("User {} applying as mentor", userId);

        if (mentorRepository.findByUserId(userId).isPresent()) {
            throw new MentorAlreadyExistsException("User has already applied as a mentor");
        }

        MentorProfile profile = mentorMapper.toEntity(userId, request);
        MentorProfile saved = mentorRepository.save(profile);
        auditService.log("MentorProfile", saved.getId(), "APPLY", userId.toString(),
                "specialization=" + request.getSpecialization());
        log.info("Mentor application submitted for userId: {}", userId);
        return mentorMapper.toDto(saved);
    }

    @Override
    @Cacheable(key = "#mentorId")
    public MentorProfileResponseDto getMentorProfile(Long mentorId) {
        log.info("Cache MISS - fetching mentorId={} from DB", mentorId);

        // Try finding by primary key (Mentor Internal ID)
        MentorProfile profile = mentorRepository.findById(mentorId)
                .orElseGet(() -> {
                    // Fallback: try finding by userId (Auth ID)
                    log.info("Mentor not found by PK {}, searching by userId", mentorId);
                    return mentorRepository.findByUserId(mentorId).orElse(null);
                });

        if (profile == null) {
            throw new MentorNotFoundException("Mentor not found with ID or UserID: " + mentorId);
        }

        return mentorMapper.toDto(profile);
    }

    @Override
    @Cacheable(key = "'user_' + #userId")
    public MentorProfileResponseDto getMentorByUserId(Long userId) {
        log.info("Cache MISS - fetching userId={} from DB", userId);
        MentorProfile profile = mentorRepository.findByUserId(userId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor profile not found for userId: " + userId));
        return mentorMapper.toDto(profile);
    }

    @Override
    @Cacheable(key = "'all_approved_p' + #page + '_s' + #size")
    public PageResponse<MentorProfileResponseDto> getAllApprovedMentors(int page, int size) {
        log.info("Cache MISS - fetching approved mentors from DB - page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<MentorProfile> mentorPage = mentorRepository.findAllApprovedMentors(pageable);
        return toPageResponse(mentorPage);
    }

    @Override
    @Cacheable(key = "'pending_p' + #page + '_s' + #size")
    public PageResponse<MentorProfileResponseDto> getPendingApplications(int page, int size) {
        log.info("Cache MISS - fetching pending applications from DB - page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<MentorProfile> mentorPage = mentorRepository.findPendingApplications(pageable);
        return toPageResponse(mentorPage);
    }

    @Override
    @Cacheable(key = "'skill_' + #skill")
    public List<MentorProfileResponseDto> searchMentorsBySpecialization(String skill) {
        log.info("Cache MISS - searching mentors by skill={} from DB", skill);
        return mentorRepository.searchBySpecialization(skill)
                .stream().map(mentorMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public PageResponse<MentorProfileResponseDto> searchMentorsWithFilters(String skill, Integer minExperience,
            Integer maxExperience, Double maxRate, Double minRating, int page, int size) {
        log.info("Searching mentors by skill={}, exp={}-{}, rate={}, rating={}, page={}, size={}", skill, minExperience, maxExperience,
                maxRate, minRating, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<MentorProfile> mentorPage = mentorRepository.searchMentorsWithFilters(skill, minExperience, maxExperience, maxRate, minRating, pageable);
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

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public MentorProfileResponseDto approveMentor(Long mentorId, Long adminId) {
        log.info("Admin {} approving mentor {}", adminId, mentorId);
        MentorProfile profile = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));

        profile.setStatus(MentorStatus.APPROVED);
        profile.setIsApproved(true);
        profile.setApprovedBy(adminId);
        profile.setApprovalDate(LocalDateTime.now());

        try {
            // Headers (X-Service-Auth, X-Internal-Service) are automatically added by
            // FeignConfig interceptor
            authServiceClient.addUserRole(profile.getUserId(), "ROLE_MENTOR");
        } catch (Exception e) {
            log.warn("Failed to update role via Feign for userId {}: {}", profile.getUserId(), e.getMessage());
        }

        MentorProfileResponseDto result = mentorMapper.toDto(mentorRepository.save(profile));
        auditService.log("MentorProfile", mentorId, "APPROVE", adminId.toString(), "approvedBy=" + adminId);

        try {
            MentorApprovedEvent event = new MentorApprovedEvent(mentorId, profile.getUserId(),
                    profile.getSpecialization());
            rabbitTemplate.convertAndSend("mentor.exchange", "mentor.approved", event);
            log.info("Published MENTOR_APPROVED event for mentorId={} userId={}", mentorId, profile.getUserId());
        } catch (Exception e) {
            log.error("Failed to publish MENTOR_APPROVED event for mentorId={}: {}", mentorId, e.getMessage());
        }

        return result;
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public MentorProfileResponseDto rejectMentor(Long mentorId, Long adminId) {
        log.info("Admin {} rejecting mentor {}", adminId, mentorId);
        MentorProfile profile = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));
        profile.setStatus(MentorStatus.REJECTED);
        profile.setIsApproved(false);
        profile.setApprovedBy(adminId);
        MentorProfileResponseDto result = mentorMapper.toDto(mentorRepository.save(profile));
        auditService.log("MentorProfile", mentorId, "REJECT", adminId.toString(), "rejectedBy=" + adminId);
        return result;
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public MentorProfileResponseDto updateAvailability(Long userId, UpdateAvailabilityRequestDto request) {
        log.info("Updating availability for userId: {}", userId);
        MentorProfile profile = mentorRepository.findByUserId(userId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor profile not found for userId: " + userId));
        profile.setAvailabilityStatus(AvailabilityStatus.valueOf(request.getAvailabilityStatus()));
        MentorProfileResponseDto result = mentorMapper.toDto(mentorRepository.save(profile));
        auditService.log("MentorProfile", profile.getId(), "UPDATE_AVAILABILITY", userId.toString(),
                "status=" + request.getAvailabilityStatus());
        return result;
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public MentorProfileResponseDto suspendMentor(Long mentorId, Long adminId) {
        log.info("Admin {} suspending mentor {}", adminId, mentorId);
        MentorProfile profile = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));
        profile.setStatus(MentorStatus.SUSPENDED);
        profile.setIsApproved(false);
        MentorProfileResponseDto result = mentorMapper.toDto(mentorRepository.save(profile));
        auditService.log("MentorProfile", mentorId, "SUSPEND", adminId.toString(), "suspendedBy=" + adminId);
        return result;
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public void updateMentorRating(Long mentorId, Double newRating) {
        log.info("Updating rating for mentorId: {} to {}", mentorId, newRating);
        MentorProfile profile = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));
        profile.setRating(newRating);
        mentorRepository.save(profile);
    }
}

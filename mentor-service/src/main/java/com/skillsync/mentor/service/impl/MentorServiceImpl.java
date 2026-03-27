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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@CacheConfig(cacheNames = "mentor")
public class MentorServiceImpl implements MentorService {

    private static final Logger log = LoggerFactory.getLogger(MentorServiceImpl.class);

    private final MentorRepository mentorRepository;

    private final AuthServiceClient authServiceClient;

    @Autowired
    public MentorServiceImpl(MentorRepository mentorRepository, AuthServiceClient authServiceClient) {
        this.mentorRepository = mentorRepository;
        this.authServiceClient = authServiceClient;
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public MentorProfileResponseDto applyAsMentor(Long userId, ApplyMentorRequestDto request) {
        log.info("User {} applying as mentor", userId);

        if (mentorRepository.findByUserId(userId).isPresent()) {
            throw new MentorAlreadyExistsException("User has already applied as a mentor");
        }

        MentorProfile profile = new MentorProfile();
        profile.setUserId(userId);
        profile.setSpecialization(request.getSpecialization());
        profile.setYearsOfExperience(request.getYearsOfExperience());
        profile.setHourlyRate(request.getHourlyRate());
        profile.setStatus(MentorStatus.PENDING);
        profile.setIsApproved(false);
        profile.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);

        MentorProfile saved = mentorRepository.save(profile);
        log.info("Mentor application submitted for userId: {}", userId);
        return mapToDto(saved);
    }

    @Override
    @Cacheable(key = "#mentorId")
    public MentorProfileResponseDto getMentorProfile(Long mentorId) {
        log.info("Cache MISS — fetching mentorId={} from DB", mentorId);
        MentorProfile profile = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor not found with ID: " + mentorId));
        return mapToDto(profile);
    }

    @Override
    @Cacheable(key = "'user_' + #userId")
    public MentorProfileResponseDto getMentorByUserId(Long userId) {
        log.info("Cache MISS — fetching userId={} from DB", userId);
        MentorProfile profile = mentorRepository.findByUserId(userId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor profile not found for userId: " + userId));
        return mapToDto(profile);
    }

    @Override
    @Cacheable(key = "'all_approved'")
    public List<MentorProfileResponseDto> getAllApprovedMentors() {
        log.info("Cache MISS — fetching all approved mentors from DB");
        return mentorRepository.findAllApprovedMentors()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Cacheable(key = "'pending'")
    public List<MentorProfileResponseDto> getPendingApplications() {
        log.info("Cache MISS — fetching pending applications from DB");
        return mentorRepository.findPendingApplications()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Cacheable(key = "'skill_' + #skill")
    public List<MentorProfileResponseDto> searchMentorsBySpecialization(String skill) {
        log.info("Cache MISS — searching mentors by skill={} from DB", skill);
        return mentorRepository.searchBySpecialization(skill)
                .stream().map(this::mapToDto).collect(Collectors.toList());
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
            // Headers (X-Service-Auth, X-Internal-Service) are automatically added by FeignConfig interceptor
            authServiceClient.addUserRole(profile.getUserId(), "ROLE_MENTOR");
        } catch (Exception e) {
            log.warn("Failed to update role via Feign for userId {}: {}", profile.getUserId(), e.getMessage());
        }

        return mapToDto(mentorRepository.save(profile));
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

        return mapToDto(mentorRepository.save(profile));
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public MentorProfileResponseDto updateAvailability(Long userId, UpdateAvailabilityRequestDto request) {
        log.info("Updating availability for userId: {}", userId);
        MentorProfile profile = mentorRepository.findByUserId(userId)
                .orElseThrow(() -> new MentorNotFoundException("Mentor profile not found for userId: " + userId));

        profile.setAvailabilityStatus(AvailabilityStatus.valueOf(request.getAvailabilityStatus()));
        return mapToDto(mentorRepository.save(profile));
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

        return mapToDto(mentorRepository.save(profile));
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

    private MentorProfileResponseDto mapToDto(MentorProfile profile) {
        return MentorProfileResponseDto.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .status(profile.getStatus() != null ? profile.getStatus().name() : null)
                .isApproved(profile.getIsApproved())
                .approvedBy(profile.getApprovedBy())
                .approvalDate(profile.getApprovalDate())
                .specialization(profile.getSpecialization())
                .yearsOfExperience(profile.getYearsOfExperience())
                .hourlyRate(profile.getHourlyRate())
                .rating(profile.getRating())
                .totalStudents(profile.getTotalStudents())
                .availabilityStatus(profile.getAvailabilityStatus() != null
                        ? profile.getAvailabilityStatus().name() : null)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}

package com.skillsync.mentor.mapper;

import com.skillsync.mentor.client.ReviewClient;
import com.skillsync.mentor.dto.ApiResponse;
import com.skillsync.mentor.dto.request.ApplyMentorRequestDto;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.dto.response.MentorRatingDto;
import com.skillsync.mentor.entity.AvailabilityStatus;
import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.entity.MentorStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MentorMapper {

    private final ReviewClient reviewClient;

    // Apply MentorRequestDto + userId -> MentorProfile entity
    public MentorProfile toEntity(Long userId, ApplyMentorRequestDto request) {
        MentorProfile profile = new MentorProfile();
        profile.setUserId(userId);
        profile.setSpecialization(request.getSpecialization());
        profile.setYearsOfExperience(request.getYearsOfExperience());
        profile.setHourlyRate(request.getHourlyRate());
        profile.setStatus(MentorStatus.PENDING);
        profile.setIsApproved(false);
        profile.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
        return profile;
    }

    // MentorProfile entity -> MentorProfileResponseDto
    public MentorProfileResponseDto toDto(MentorProfile profile) {
        MentorProfileResponseDto dto = MentorProfileResponseDto.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .status(profile.getStatus() != null ? profile.getStatus().name() : null)
                .isApproved(profile.getIsApproved())
                .approvedBy(profile.getApprovedBy())
                .approvalDate(profile.getApprovalDate())
                .specialization(profile.getSpecialization())
                .yearsOfExperience(profile.getYearsOfExperience())
                .hourlyRate(profile.getHourlyRate())
                // Use DB values as default
                .rating(profile.getRating())
                .totalStudents(profile.getTotalStudents())
                .availabilityStatus(profile.getAvailabilityStatus() != null
                        ? profile.getAvailabilityStatus().name() : null)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();

        // Enrich with real-time stats from review-service
        try {
            log.debug("Fetching real-time rating for mentor: {}", profile.getUserId());
            ApiResponse<MentorRatingDto> response = reviewClient.getMentorRating(profile.getUserId()).getBody();
            if (response != null && response.isSuccess() && response.getData() != null) {
                dto.setRating(response.getData().getAverageRating());
                dto.setTotalStudents(response.getData().getTotalLearners());
                log.debug("   Rating enriched: {} ({} learners)", dto.getRating(), dto.getTotalStudents());
            }
        } catch (Exception e) {
            log.error("Failed to fetch live rating for mentor {}: {}", profile.getUserId(), e.getMessage());
        }

        return dto;
    }
}


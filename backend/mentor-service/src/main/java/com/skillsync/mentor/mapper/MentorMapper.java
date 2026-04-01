package com.skillsync.mentor.mapper;

import com.skillsync.mentor.dto.request.ApplyMentorRequestDto;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.entity.AvailabilityStatus;
import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.entity.MentorStatus;
import org.springframework.stereotype.Component;

@Component
public class MentorMapper {

    // ApplyMentorRequestDto + userId -> MentorProfile entity
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

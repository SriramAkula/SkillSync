package com.skillsync.mentor.service;

import org.springframework.data.domain.Page;
import com.skillsync.mentor.dto.request.ApplyMentorRequestDto;
import com.skillsync.mentor.dto.request.UpdateAvailabilityRequestDto;
import com.skillsync.mentor.dto.PageResponse;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import java.util.List;

public interface MentorService {
    MentorProfileResponseDto applyAsMentor(Long userId, ApplyMentorRequestDto request);

    MentorProfileResponseDto getMentorProfile(Long mentorId);

    MentorProfileResponseDto getMentorByUserId(Long userId);

    PageResponse<MentorProfileResponseDto> getAllApprovedMentors(int page, int size);

    PageResponse<MentorProfileResponseDto> getPendingApplications(int page, int size);

    List<MentorProfileResponseDto> searchMentorsBySpecialization(String skill);

    PageResponse<MentorProfileResponseDto> searchMentorsWithFilters(String skill, Integer minExperience, Integer maxExperience,
            Double maxRate, Double minRating, int page, int size);

    MentorProfileResponseDto approveMentor(Long mentorId, Long adminId);

    MentorProfileResponseDto rejectMentor(Long mentorId, Long adminId);

    MentorProfileResponseDto updateAvailability(Long userId, UpdateAvailabilityRequestDto request);

    MentorProfileResponseDto suspendMentor(Long mentorId, Long adminId);

    void updateMentorRating(Long mentorId, Double newRating);
    
    void deleteMentorProfile(Long userId);
}



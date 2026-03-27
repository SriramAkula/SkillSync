package com.skillsync.mentor.service;

import com.skillsync.mentor.dto.request.ApplyMentorRequestDto;
import com.skillsync.mentor.dto.request.UpdateAvailabilityRequestDto;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import java.util.List;

public interface MentorService {
    MentorProfileResponseDto applyAsMentor(Long userId, ApplyMentorRequestDto request);
    MentorProfileResponseDto getMentorProfile(Long mentorId);
    MentorProfileResponseDto getMentorByUserId(Long userId);
    List<MentorProfileResponseDto> getAllApprovedMentors();
    List<MentorProfileResponseDto> getPendingApplications();
    List<MentorProfileResponseDto> searchMentorsBySpecialization(String skill);
    MentorProfileResponseDto approveMentor(Long mentorId, Long adminId);
    MentorProfileResponseDto rejectMentor(Long mentorId, Long adminId);
    MentorProfileResponseDto updateAvailability(Long userId, UpdateAvailabilityRequestDto request);
    MentorProfileResponseDto suspendMentor(Long mentorId, Long adminId);
    void updateMentorRating(Long mentorId, Double newRating);
}

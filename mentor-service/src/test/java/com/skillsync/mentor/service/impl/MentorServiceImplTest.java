package com.skillsync.mentor.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

@ExtendWith(MockitoExtension.class)
class MentorServiceImplTest {

    @Mock private MentorRepository mentorRepository;
    @Mock private AuthServiceClient authServiceClient;
    @InjectMocks private MentorServiceImpl mentorService;

    private MentorProfile pendingProfile;
    private MentorProfile approvedProfile;
    private ApplyMentorRequestDto applyRequest;

    @BeforeEach
    void setUp() {
        pendingProfile = new MentorProfile();
        pendingProfile.setId(1L);
        pendingProfile.setUserId(10L);
        pendingProfile.setStatus(MentorStatus.PENDING);
        pendingProfile.setIsApproved(false);
        pendingProfile.setSpecialization("Java");
        pendingProfile.setYearsOfExperience(5);
        pendingProfile.setHourlyRate(50.0);
        pendingProfile.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
        pendingProfile.setRating(0.0);
        pendingProfile.setTotalStudents(0);
        pendingProfile.setCreatedAt(LocalDateTime.now());
        pendingProfile.setUpdatedAt(LocalDateTime.now());

        approvedProfile = new MentorProfile();
        approvedProfile.setId(1L);
        approvedProfile.setUserId(10L);
        approvedProfile.setStatus(MentorStatus.APPROVED);
        approvedProfile.setIsApproved(true);
        approvedProfile.setApprovedBy(99L);
        approvedProfile.setApprovalDate(LocalDateTime.now());
        approvedProfile.setSpecialization("Java");
        approvedProfile.setYearsOfExperience(5);
        approvedProfile.setHourlyRate(50.0);
        approvedProfile.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
        approvedProfile.setRating(0.0);
        approvedProfile.setTotalStudents(0);
        approvedProfile.setCreatedAt(LocalDateTime.now());
        approvedProfile.setUpdatedAt(LocalDateTime.now());

        applyRequest = new ApplyMentorRequestDto();
        applyRequest.setSpecialization("Java");
        applyRequest.setYearsOfExperience(5);
        applyRequest.setHourlyRate(50.0);
        applyRequest.setBio("Experienced Java developer with 5 years");
    }

    // ─── applyAsMentor ───────────────────────────────────────────────────────

    @Test
    void applyAsMentor_shouldReturnPendingDto_whenNewUser() {
        when(mentorRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(mentorRepository.save(any(MentorProfile.class))).thenReturn(pendingProfile);

        MentorProfileResponseDto result = mentorService.applyAsMentor(10L, applyRequest);

        assertThat(result.getStatus()).isEqualTo("PENDING");
        assertThat(result.getIsApproved()).isFalse();
        assertThat(result.getUserId()).isEqualTo(10L);
        verify(mentorRepository).save(argThat(p ->
                p.getUserId().equals(10L) &&
                p.getStatus() == MentorStatus.PENDING &&
                !p.getIsApproved()
        ));
    }

    @Test
    void applyAsMentor_shouldThrow_whenAlreadyApplied() {
        when(mentorRepository.findByUserId(10L)).thenReturn(Optional.of(pendingProfile));

        assertThatThrownBy(() -> mentorService.applyAsMentor(10L, applyRequest))
                .isInstanceOf(MentorAlreadyExistsException.class)
                .hasMessageContaining("already applied");

        verify(mentorRepository, never()).save(any());
    }

    // ─── getMentorProfile ────────────────────────────────────────────────────

    @Test
    void getMentorProfile_shouldReturnDto_whenExists() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(pendingProfile));

        MentorProfileResponseDto result = mentorService.getMentorProfile(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSpecialization()).isEqualTo("Java");
        assertThat(result.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void getMentorProfile_shouldThrow_whenNotFound() {
        when(mentorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mentorService.getMentorProfile(99L))
                .isInstanceOf(MentorNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── getMentorByUserId ───────────────────────────────────────────────────

    @Test
    void getMentorByUserId_shouldReturnDto_whenExists() {
        when(mentorRepository.findByUserId(10L)).thenReturn(Optional.of(pendingProfile));

        MentorProfileResponseDto result = mentorService.getMentorByUserId(10L);

        assertThat(result.getUserId()).isEqualTo(10L);
    }

    @Test
    void getMentorByUserId_shouldThrow_whenNotFound() {
        when(mentorRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mentorService.getMentorByUserId(99L))
                .isInstanceOf(MentorNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── getAllApprovedMentors ────────────────────────────────────────────────

    @Test
    void getAllApprovedMentors_shouldReturnList_whenApprovedExist() {
        when(mentorRepository.findAllApprovedMentors()).thenReturn(List.of(approvedProfile));

        List<MentorProfileResponseDto> result = mentorService.getAllApprovedMentors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getIsApproved()).isTrue();
        assertThat(result.get(0).getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void getAllApprovedMentors_shouldReturnEmpty_whenNone() {
        when(mentorRepository.findAllApprovedMentors()).thenReturn(List.of());

        assertThat(mentorService.getAllApprovedMentors()).isEmpty();
    }

    // ─── getPendingApplications ──────────────────────────────────────────────

    @Test
    void getPendingApplications_shouldReturnPendingList() {
        when(mentorRepository.findPendingApplications()).thenReturn(List.of(pendingProfile));

        List<MentorProfileResponseDto> result = mentorService.getPendingApplications();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("PENDING");
    }

    @Test
    void getPendingApplications_shouldReturnEmpty_whenNone() {
        when(mentorRepository.findPendingApplications()).thenReturn(List.of());

        assertThat(mentorService.getPendingApplications()).isEmpty();
    }

    // ─── searchMentorsBySpecialization ───────────────────────────────────────

    @Test
    void searchMentors_shouldReturnMatches_whenSkillMatches() {
        when(mentorRepository.searchBySpecialization("Java")).thenReturn(List.of(approvedProfile));

        List<MentorProfileResponseDto> result = mentorService.searchMentorsBySpecialization("Java");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSpecialization()).isEqualTo("Java");
    }

    @Test
    void searchMentors_shouldReturnEmpty_whenNoMatch() {
        when(mentorRepository.searchBySpecialization("Rust")).thenReturn(List.of());

        assertThat(mentorService.searchMentorsBySpecialization("Rust")).isEmpty();
    }

    // ─── approveMentor ───────────────────────────────────────────────────────

    @Test
    void approveMentor_shouldSetApprovedAndCallFeign_whenValid() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(pendingProfile));
        when(mentorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(authServiceClient.addUserRole(anyLong(), anyString())).thenReturn(null);

        MentorProfileResponseDto result = mentorService.approveMentor(1L, 99L);

        assertThat(result.getStatus()).isEqualTo("APPROVED");
        assertThat(result.getIsApproved()).isTrue();
        assertThat(result.getApprovedBy()).isEqualTo(99L);
        verify(authServiceClient).addUserRole(10L, "ROLE_MENTOR");
    }

    @Test
    void approveMentor_shouldStillSucceed_whenFeignFails() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(pendingProfile));
        when(mentorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(authServiceClient.addUserRole(anyLong(), anyString()))
                .thenThrow(new RuntimeException("Feign error"));

        MentorProfileResponseDto result = mentorService.approveMentor(1L, 99L);

        assertThat(result.getStatus()).isEqualTo("APPROVED");
        assertThat(result.getIsApproved()).isTrue();
    }

    @Test
    void approveMentor_shouldThrow_whenMentorNotFound() {
        when(mentorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mentorService.approveMentor(99L, 1L))
                .isInstanceOf(MentorNotFoundException.class);

        verify(mentorRepository, never()).save(any());
    }

    // ─── rejectMentor ────────────────────────────────────────────────────────

    @Test
    void rejectMentor_shouldSetRejected_whenValid() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(pendingProfile));
        when(mentorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MentorProfileResponseDto result = mentorService.rejectMentor(1L, 99L);

        assertThat(result.getStatus()).isEqualTo("REJECTED");
        assertThat(result.getIsApproved()).isFalse();
        verify(mentorRepository).save(argThat(p -> p.getStatus() == MentorStatus.REJECTED));
    }

    @Test
    void rejectMentor_shouldThrow_whenNotFound() {
        when(mentorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mentorService.rejectMentor(99L, 1L))
                .isInstanceOf(MentorNotFoundException.class);
    }

    // ─── updateAvailability ──────────────────────────────────────────────────

    @Test
    void updateAvailability_shouldSetBusy_whenValid() {
        UpdateAvailabilityRequestDto request = new UpdateAvailabilityRequestDto();
        request.setAvailabilityStatus("BUSY");
        when(mentorRepository.findByUserId(10L)).thenReturn(Optional.of(approvedProfile));
        when(mentorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MentorProfileResponseDto result = mentorService.updateAvailability(10L, request);

        assertThat(result.getAvailabilityStatus()).isEqualTo("BUSY");
        verify(mentorRepository).save(argThat(p ->
                p.getAvailabilityStatus() == AvailabilityStatus.BUSY));
    }

    @Test
    void updateAvailability_shouldSetAvailable_whenValid() {
        UpdateAvailabilityRequestDto request = new UpdateAvailabilityRequestDto();
        request.setAvailabilityStatus("AVAILABLE");
        when(mentorRepository.findByUserId(10L)).thenReturn(Optional.of(approvedProfile));
        when(mentorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MentorProfileResponseDto result = mentorService.updateAvailability(10L, request);

        assertThat(result.getAvailabilityStatus()).isEqualTo("AVAILABLE");
    }

    @Test
    void updateAvailability_shouldThrow_whenMentorNotFound() {
        UpdateAvailabilityRequestDto request = new UpdateAvailabilityRequestDto();
        request.setAvailabilityStatus("BUSY");
        when(mentorRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mentorService.updateAvailability(99L, request))
                .isInstanceOf(MentorNotFoundException.class);
    }

    @Test
    void updateAvailability_shouldThrow_whenInvalidStatus() {
        UpdateAvailabilityRequestDto request = new UpdateAvailabilityRequestDto();
        request.setAvailabilityStatus("INVALID_STATUS");
        when(mentorRepository.findByUserId(10L)).thenReturn(Optional.of(approvedProfile));

        assertThatThrownBy(() -> mentorService.updateAvailability(10L, request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ─── suspendMentor ───────────────────────────────────────────────────────

    @Test
    void suspendMentor_shouldSetSuspended_whenValid() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(approvedProfile));
        when(mentorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MentorProfileResponseDto result = mentorService.suspendMentor(1L, 99L);

        assertThat(result.getStatus()).isEqualTo("SUSPENDED");
        assertThat(result.getIsApproved()).isFalse();
        verify(mentorRepository).save(argThat(p ->
                p.getStatus() == MentorStatus.SUSPENDED && !p.getIsApproved()));
    }

    @Test
    void suspendMentor_shouldThrow_whenNotFound() {
        when(mentorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mentorService.suspendMentor(99L, 1L))
                .isInstanceOf(MentorNotFoundException.class);
    }

    // ─── updateMentorRating ──────────────────────────────────────────────────

    @Test
    void updateMentorRating_shouldUpdateRating_whenValid() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(approvedProfile));
        when(mentorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mentorService.updateMentorRating(1L, 4.5);

        verify(mentorRepository).save(argThat(p -> p.getRating().equals(4.5)));
    }

    @Test
    void updateMentorRating_shouldThrow_whenNotFound() {
        when(mentorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mentorService.updateMentorRating(99L, 4.5))
                .isInstanceOf(MentorNotFoundException.class);

        verify(mentorRepository, never()).save(any());
    }

    @Test
    void updateMentorRating_shouldUpdateToZero_whenRatingIsZero() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(approvedProfile));
        when(mentorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mentorService.updateMentorRating(1L, 0.0);

        verify(mentorRepository).save(argThat(p -> p.getRating().equals(0.0)));
    }
}

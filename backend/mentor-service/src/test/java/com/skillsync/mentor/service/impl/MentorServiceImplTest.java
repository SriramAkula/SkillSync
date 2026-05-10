package com.skillsync.mentor.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.skillsync.mentor.client.AuthServiceClient;
import com.skillsync.mentor.dto.PageResponse;
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
import com.skillsync.mentor.audit.AuditService;
import com.skillsync.mentor.event.MentorApprovedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class MentorServiceImplTest {

    @Mock private MentorRepository mentorRepository;
    @Mock private AuthServiceClient authServiceClient;
    @Mock private MentorMapper mentorMapper;
    @Mock private AuditService auditService;
    @Mock private RabbitTemplate rabbitTemplate;

    @InjectMocks private MentorServiceImpl mentorService;

    private MentorProfile profile;
    private MentorProfileResponseDto responseDto;

    @BeforeEach
    void setUp() {
        profile = new MentorProfile();
        profile.setId(1L);
        profile.setUserId(100L);
        profile.setSpecialization("Java");

        responseDto = MentorProfileResponseDto.builder()
                .id(1L).userId(100L).build();
    }

    @Test
    void applyAsMentor_shouldSave_whenNew() {
        ApplyMentorRequestDto request = new ApplyMentorRequestDto();
        when(mentorRepository.findByUserId(100L)).thenReturn(Optional.empty());
        when(mentorMapper.toEntity(eq(100L), any())).thenReturn(profile);
        when(mentorRepository.save(profile)).thenReturn(profile);
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorService.applyAsMentor(100L, request);

        assertThat(result).isEqualTo(responseDto);
        verify(auditService).log(anyString(), anyLong(), eq("APPLY"), anyString(), anyString());
    }

    @Test
    void applyAsMentor_shouldThrowException_whenAlreadyExists() {
        when(mentorRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        assertThrows(MentorAlreadyExistsException.class, () -> mentorService.applyAsMentor(100L, new ApplyMentorRequestDto()));
    }

    @Test
    void getMentorProfile_shouldReturnFromPrimaryId() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorService.getMentorProfile(1L);

        assertThat(result).isEqualTo(responseDto);
    }

    @Test
    void getMentorProfile_shouldReturnFromUserId_whenPrimaryIdFails() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.empty());
        when(mentorRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorService.getMentorProfile(1L);

        assertThat(result).isEqualTo(responseDto);
    }

    @Test
    void getMentorProfile_shouldThrowNotFound_whenBothFail() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.empty());
        when(mentorRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(MentorNotFoundException.class, () -> mentorService.getMentorProfile(1L));
    }

    @Test
    void approveMentor_shouldPublishEventAndHandleExceptions() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);
        
        // Path 1: Success
        mentorService.approveMentor(1L, 99L);
        verify(rabbitTemplate).convertAndSend(eq("mentor.exchange"), eq("mentor.approved"), any(MentorApprovedEvent.class));

        // Path 2: Auth fail, Rabbit fail
        doThrow(new RuntimeException("Auth error")).when(authServiceClient).addUserRole(anyLong(), anyString());
        doThrow(new RuntimeException("Rabbit error")).when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));
        
        mentorService.approveMentor(1L, 99L);
        // Should catch and not rethrow
    }

    @Test
    void rejectMentor_shouldHandleFlow() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);

        mentorService.rejectMentor(1L, 99L);

        assertThat(profile.getStatus()).isEqualTo(MentorStatus.REJECTED);
    }

    @Test
    void updateAvailability_shouldHandleFlow() {
        UpdateAvailabilityRequestDto request = new UpdateAvailabilityRequestDto();
        request.setAvailabilityStatus("BUSY");
        when(mentorRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);

        mentorService.updateAvailability(100L, request);

        assertThat(profile.getAvailabilityStatus()).isEqualTo(AvailabilityStatus.BUSY);
    }

    @Test
    void suspendMentor_shouldHandleFlow() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);

        mentorService.suspendMentor(1L, 99L);

        assertThat(profile.getStatus()).isEqualTo(MentorStatus.SUSPENDED);
    }

    @Test
    void searchMentorsWithFilters_shouldReturnPage() {
        Page<MentorProfile> page = new PageImpl<>(List.of(profile));
        when(mentorRepository.searchMentorsWithFilters(any(), any(), any(), any(), any(), any())).thenReturn(page);
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        PageResponse<MentorProfileResponseDto> result = mentorService.searchMentorsWithFilters("Java", 1, 10, 50.0, 4.0, 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getAllApprovedMentors_shouldReturnPage() {
        Page<MentorProfile> page = new PageImpl<>(List.of(profile));
        when(mentorRepository.findAllApprovedMentors(any())).thenReturn(page);
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        var result = mentorService.getAllApprovedMentors(0, 10);
        assertThat(result.getContent()).isNotEmpty();
    }

    @Test
    void getPendingApplications_shouldReturnPage() {
        Page<MentorProfile> page = new PageImpl<>(List.of(profile));
        when(mentorRepository.findPendingApplications(any())).thenReturn(page);
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        var result = mentorService.getPendingApplications(0, 10);
        assertThat(result.getContent()).isNotEmpty();
    }

    @Test
    void searchMentorsBySpecialization_shouldReturnList() {
        when(mentorRepository.searchBySpecialization("Java")).thenReturn(List.of(profile));
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        var result = mentorService.searchMentorsBySpecialization("Java");
        assertThat(result).isNotEmpty();
    }

    @Test
    void updateMentorRating_shouldUpdate() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        mentorService.updateMentorRating(1L, 4.5);
        assertThat(profile.getRating()).isEqualTo(4.5);
        verify(mentorRepository).save(profile);
    }

    @Test
    void deleteMentorProfile_shouldDelete_whenRejected() {
        profile.setStatus(MentorStatus.REJECTED);
        when(mentorRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        
        mentorService.deleteMentorProfile(100L);
        
        verify(mentorRepository).delete(profile);
        verify(auditService).log(anyString(), anyLong(), eq("DELETE"), anyString(), anyString());
    }

    @Test
    void deleteMentorProfile_shouldThrowException_whenNotRejected() {
        profile.setStatus(MentorStatus.PENDING);
        when(mentorRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        
        assertThrows(IllegalStateException.class, () -> mentorService.deleteMentorProfile(100L));
        verify(mentorRepository, never()).delete(any());
    }
}

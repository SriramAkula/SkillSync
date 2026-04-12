package com.skillsync.mentor.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.skillsync.mentor.client.AuthServiceClient;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class MentorCommandServiceTest {

    @Mock private MentorRepository mentorRepository;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private ValueOperations<String, Object> valueOperations;
    @Mock private AuthServiceClient authServiceClient;
    @Mock private MentorMapper mentorMapper;

    @InjectMocks private MentorCommandService mentorCommandService;

    private MentorProfile profile;
    private MentorProfileResponseDto responseDto;

    @BeforeEach
    void setUp() {
        profile = new MentorProfile();
        profile.setId(1L);
        profile.setUserId(100L);
        profile.setStatus(MentorStatus.PENDING);

        responseDto = MentorProfileResponseDto.builder()
                .id(1L).userId(100L).build();
        
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void applyAsMentor_shouldSaveAndCache_whenNew() {
        ApplyMentorRequestDto request = new ApplyMentorRequestDto();
        when(mentorRepository.existsByUserId(100L)).thenReturn(false);
        when(mentorMapper.toEntity(eq(100L), any())).thenReturn(profile);
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorCommandService.applyAsMentor(100L, request);

        assertThat(result).isEqualTo(responseDto);
        verify(valueOperations).set(eq("mentor:1"), any(), anyLong(), any());
    }

    @Test
    void applyAsMentor_shouldThrowException_whenExists() {
        when(mentorRepository.existsByUserId(100L)).thenReturn(true);
        assertThrows(MentorAlreadyExistsException.class, () -> mentorCommandService.applyAsMentor(100L, new ApplyMentorRequestDto()));
    }

    @Test
    void approveMentor_shouldUpdateStatusAndCallAuthClient() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorCommandService.approveMentor(1L, 999L);

        assertThat(profile.getStatus()).isEqualTo(MentorStatus.APPROVED);
        assertThat(profile.getIsApproved()).isTrue();
        verify(authServiceClient).addUserRole(100L, "ROLE_MENTOR");
        verify(valueOperations).set(eq("mentor:1"), any(), anyLong(), any());
    }

    @Test
    void approveMentor_shouldHandleAuthClientException() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);
        doThrow(new RuntimeException("Feign error")).when(authServiceClient).addUserRole(anyLong(), anyString());

        MentorProfileResponseDto result = mentorCommandService.approveMentor(1L, 999L);

        assertThat(result).isEqualTo(responseDto);
    }

    @Test
    void rejectMentor_shouldUpdateStatus() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);

        mentorCommandService.rejectMentor(1L, 999L);

        assertThat(profile.getStatus()).isEqualTo(MentorStatus.REJECTED);
        verify(valueOperations).set(eq("mentor:1"), any(), anyLong(), any());
    }

    @Test
    void suspendMentor_shouldUpdateStatus() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);

        mentorCommandService.suspendMentor(1L, 999L);

        assertThat(profile.getStatus()).isEqualTo(MentorStatus.SUSPENDED);
    }

    @Test
    void updateAvailability_shouldUpdateAndCache() {
        UpdateAvailabilityRequestDto request = new UpdateAvailabilityRequestDto();
        request.setAvailabilityStatus("BUSY");
        when(mentorRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);

        mentorCommandService.updateAvailability(100L, request);

        assertThat(profile.getAvailabilityStatus()).isEqualTo(AvailabilityStatus.BUSY);
    }

    @Test
    void updateMentorRating_shouldUpdateAndCache() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);

        mentorCommandService.updateMentorRating(1L, 4.8);

        assertThat(profile.getRating()).isEqualTo(4.8);
    }

    @Test
    void updateCache_shouldHandleRedisException() {
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorRepository.save(any())).thenReturn(profile);
        when(mentorMapper.toDto(any())).thenReturn(responseDto);
        doThrow(new RuntimeException("Redis error")).when(valueOperations).set(anyString(), any(), anyLong(), any());

        mentorCommandService.approveMentor(1L, 999L);

        verify(mentorRepository).save(any()); // Should still save
    }

    @Test
    void evictCache_shouldHandleRedisException() {
        doThrow(new RuntimeException("Redis error")).when(redisTemplate).delete(anyString());
        
        mentorCommandService.evictCache(1L);
        
        verify(redisTemplate).delete("mentor:1");
    }
}

package com.skillsync.mentor.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.skillsync.mentor.dto.PageResponse;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.exception.MentorNotFoundException;
import com.skillsync.mentor.mapper.MentorMapper;
import com.skillsync.mentor.repository.MentorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class MentorQueryServiceTest {

    @Mock private MentorRepository mentorRepository;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private ValueOperations<String, Object> valueOperations;
    @Mock private MentorMapper mentorMapper;

    @InjectMocks private MentorQueryService mentorQueryService;

    private MentorProfile profile;
    private MentorProfileResponseDto responseDto;

    @BeforeEach
    void setUp() {
        profile = new MentorProfile();
        profile.setId(1L);
        profile.setUserId(100L);

        responseDto = MentorProfileResponseDto.builder()
                .id(1L).userId(100L).build();
        
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void getMentorById_shouldReturnFromCache_whenPresent() {
        when(valueOperations.get("mentor:1")).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorQueryService.getMentorById(1L);

        assertThat(result).isEqualTo(responseDto);
        verifyNoInteractions(mentorRepository);
    }

    @Test
    void getMentorById_shouldFetchFromDb_whenCacheMiss() {
        when(valueOperations.get(anyString())).thenReturn(null);
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorQueryService.getMentorById(1L);

        assertThat(result).isEqualTo(responseDto);
        verify(valueOperations).set(eq("mentor:1"), eq(responseDto), anyLong(), any());
    }

    @Test
    void getMentorById_shouldThrowNotFound_whenMissingInDb() {
        when(valueOperations.get(anyString())).thenReturn(null);
        when(mentorRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(MentorNotFoundException.class, () -> mentorQueryService.getMentorById(1L));
    }

    @Test
    void getFromCache_shouldHandleRedisException() {
        when(valueOperations.get(anyString())).thenThrow(new RuntimeException("Redis down"));
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorQueryService.getMentorById(1L);

        assertThat(result).isEqualTo(responseDto);
    }

    @Test
    void getFromCache_shouldHandleTypeMismatch() {
        when(valueOperations.get(anyString())).thenReturn("NotADto");
        when(mentorRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorQueryService.getMentorById(1L);

        assertThat(result).isEqualTo(responseDto);
    }

    @Test
    void getMentorByUserId_shouldHandleFlow() {
        when(valueOperations.get(anyString())).thenReturn(null);
        when(mentorRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorQueryService.getMentorByUserId(100L);

        assertThat(result).isEqualTo(responseDto);
        verify(valueOperations).set(eq("mentor:user:100"), eq(responseDto), anyLong(), any());
    }

    @Test
    void getMentorByUserId_shouldReturnFromCache_whenPresent() {
        when(valueOperations.get("mentor:user:100")).thenReturn(responseDto);

        MentorProfileResponseDto result = mentorQueryService.getMentorByUserId(100L);

        assertThat(result).isEqualTo(responseDto);
        verifyNoInteractions(mentorRepository);
    }

    @Test
    void getAllApprovedMentors_shouldReturnPageResponse() {
        Page<MentorProfile> page = new PageImpl<>(List.of(profile));
        when(mentorRepository.findAllApprovedMentors(any())).thenReturn(page);
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        PageResponse<MentorProfileResponseDto> result = mentorQueryService.getAllApprovedMentors(0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getPendingApplications_shouldReturnPageResponse() {
        Page<MentorProfile> page = new PageImpl<>(List.of(profile));
        when(mentorRepository.findPendingApplications(any())).thenReturn(page);
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        PageResponse<MentorProfileResponseDto> result = mentorQueryService.getPendingApplications(0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void searchMentorsBySpecialization_shouldReturnList() {
        when(mentorRepository.searchBySpecialization("Java")).thenReturn(List.of(profile));
        when(mentorMapper.toDto(profile)).thenReturn(responseDto);

        List<MentorProfileResponseDto> result = mentorQueryService.searchMentorsBySpecialization("Java");

        assertThat(result).hasSize(1);
    }
}

package com.skillsync.mentor.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

import com.skillsync.mentor.client.ReviewClient;
import com.skillsync.mentor.dto.ApiResponse;
import com.skillsync.mentor.dto.request.ApplyMentorRequestDto;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.dto.response.MentorRatingDto;
import com.skillsync.mentor.entity.AvailabilityStatus;
import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.entity.MentorStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class MentorMapperTest {

    @Mock
    private ReviewClient reviewClient;

    @InjectMocks
    private MentorMapper mentorMapper;

    @Test
    void toEntity_shouldMapCorrectly() {
        ApplyMentorRequestDto request = new ApplyMentorRequestDto();
        request.setSpecialization("Java");
        request.setYearsOfExperience(5);
        request.setHourlyRate(50.0);

        MentorProfile result = mentorMapper.toEntity(1L, request);

        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getSpecialization()).isEqualTo("Java");
        assertThat(result.getYearsOfExperience()).isEqualTo(5);
        assertThat(result.getHourlyRate()).isEqualTo(50.0);
        assertThat(result.getStatus()).isEqualTo(MentorStatus.PENDING);
        assertThat(result.getIsApproved()).isFalse();
        assertThat(result.getAvailabilityStatus()).isEqualTo(AvailabilityStatus.AVAILABLE);
    }

    @Test
    void toDto_shouldEnrichWithRating_whenReviewServiceIsUp() {
        MentorProfile profile = new MentorProfile();
        profile.setId(1L);
        profile.setUserId(100L);
        profile.setStatus(MentorStatus.APPROVED);
        profile.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);

        MentorRatingDto ratingDto = new MentorRatingDto();
        ratingDto.setAverageRating(4.5);
        ratingDto.setTotalLearners(10);
        ApiResponse<MentorRatingDto> apiResponse = ApiResponse.<MentorRatingDto>builder()
                .success(true).data(ratingDto).build();

        when(reviewClient.getMentorRating(100L)).thenReturn(ResponseEntity.ok(apiResponse));

        MentorProfileResponseDto dto = mentorMapper.toDto(profile);

        assertThat(dto.getRating()).isEqualTo(4.5);
        assertThat(dto.getTotalStudents()).isEqualTo(10);
        assertThat(dto.getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void toDto_shouldHandleNullEnumValues() {
        MentorProfile profile = new MentorProfile();
        profile.setUserId(100L);
        profile.setStatus(null);
        profile.setAvailabilityStatus(null);

        when(reviewClient.getMentorRating(anyLong())).thenThrow(new RuntimeException("Offline"));

        MentorProfileResponseDto dto = mentorMapper.toDto(profile);

        assertThat(dto.getStatus()).isNull();
        assertThat(dto.getAvailabilityStatus()).isNull();
    }

    @Test
    void toDto_shouldHandleEmptyApiResponse() {
        MentorProfile profile = new MentorProfile();
        profile.setUserId(100L);
        profile.setRating(3.0);
        profile.setTotalStudents(5);

        when(reviewClient.getMentorRating(anyLong())).thenReturn(ResponseEntity.ok(null));

        MentorProfileResponseDto dto = mentorMapper.toDto(profile);

        assertThat(dto.getRating()).isEqualTo(3.0);
        assertThat(dto.getTotalStudents()).isEqualTo(5);
    }

    @Test
    void toDto_shouldHandleFailedApiResponse() {
        MentorProfile profile = new MentorProfile();
        profile.setUserId(100L);
        profile.setRating(3.0);
        
        ApiResponse<MentorRatingDto> failedResponse = ApiResponse.<MentorRatingDto>builder()
                .success(false).build();
        when(reviewClient.getMentorRating(anyLong())).thenReturn(ResponseEntity.ok(failedResponse));

        MentorProfileResponseDto dto = mentorMapper.toDto(profile);
        assertThat(dto.getRating()).isEqualTo(3.0);
    }

    @Test
    void toDto_shouldHandleNullDataInApiResponse() {
        MentorProfile profile = new MentorProfile();
        profile.setUserId(100L);
        profile.setRating(3.0);
        
        ApiResponse<MentorRatingDto> response = ApiResponse.<MentorRatingDto>builder()
                .success(true).data(null).build();
        when(reviewClient.getMentorRating(anyLong())).thenReturn(ResponseEntity.ok(response));

        MentorProfileResponseDto dto = mentorMapper.toDto(profile);
        assertThat(dto.getRating()).isEqualTo(3.0);
    }
}

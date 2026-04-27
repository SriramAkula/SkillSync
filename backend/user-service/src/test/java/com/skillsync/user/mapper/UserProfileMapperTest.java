package com.skillsync.user.mapper;

import com.skillsync.user.client.AuthClient;
import com.skillsync.user.client.ReviewClient;
import com.skillsync.user.dto.internal.MentorRatingDto;
import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.ApiResponse;
import com.skillsync.user.dto.response.UserProfileAdminResponseDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.entity.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileMapperTest {

    @Mock private AuthClient authClient;
    @Mock private ReviewClient reviewClient;

    @InjectMocks private UserProfileMapper userProfileMapper;

    private UserProfile profile;

    @BeforeEach
    void setUp() {
        profile = new UserProfile();
        profile.setId(1L);
        profile.setUserId(10L);
        profile.setEmail("john.doe@example.com");
        profile.setUsername("jdoe");
        profile.setRating(4.5);
        profile.setTotalReviews(10);
        profile.setProfileComplete(true);
    }

    @Test
    void toEntity_shouldMapCorrectly_withUsername() {
        UserProfile result = userProfileMapper.toEntity(10L, "test@example.com", "testuser");
        assertThat(result.getUserId()).isEqualTo(10L);
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getUsername()).isEqualTo("testuser");
    }

    @Test
    void toEntity_shouldFallbackToEmailPrefix_whenUsernameEmpty() {
        UserProfile result = userProfileMapper.toEntity(10L, "test@example.com", " ");
        assertThat(result.getUsername()).isEqualTo("test");
    }

    @Test
    void toEntity_shouldFallbackToEmailPrefix_whenUsernameBlank() {
        UserProfile result = userProfileMapper.toEntity(10L, "test@example.com", "   ");
        assertThat(result.getUsername()).isEqualTo("test");
    }

    @Test
    void updateEntity_shouldUpdateFields() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("newuser", "New Name", "New Bio", "123", "Java");
        userProfileMapper.updateEntity(profile, request);
        
        assertThat(profile.getUsername()).isEqualTo("newuser");
        assertThat(profile.getName()).isEqualTo("New Name");
        assertThat(profile.getProfileComplete()).isTrue();
    }

    @Test
    void toDto_shouldMapFields() {
        UserProfileResponseDto result = userProfileMapper.toDto(profile);
        assertThat(result.getUserId()).isEqualTo(10L);
        assertThat(result.getUsername()).isEqualTo("jdoe");
    }

    @Test
    void toAdminDto_shouldEnrichWithClientData() {
        MentorRatingDto ratingData = new MentorRatingDto(10L, 5.0, 20);
        ApiResponse<MentorRatingDto> apiResponse = new ApiResponse<>(true, "Success", ratingData, 200);
        Set<String> roles = Set.of("ROLE_ADMIN", "ROLE_USER");

        when(reviewClient.getMentorRating(anyLong())).thenReturn(apiResponse);
        when(authClient.getUserRoles(anyLong())).thenReturn(roles);

        UserProfileAdminResponseDto result = userProfileMapper.toAdminDto(profile);

        assertThat(result.getRating()).isEqualTo(5.0);
        assertThat(result.getTotalReviews()).isEqualTo(20);
        assertThat(result.getRoles()).contains("ROLE_ADMIN");
    }

    @Test
    void toAdminDto_shouldUseFallback_whenClientsFail() {
        when(reviewClient.getMentorRating(anyLong())).thenThrow(new RuntimeException("Service Down"));
        when(authClient.getUserRoles(anyLong())).thenThrow(new RuntimeException("Service Down"));

        UserProfileAdminResponseDto result = userProfileMapper.toAdminDto(profile);

        assertThat(result.getRating()).isEqualTo(4.5); // Fallback to local
        assertThat(result.getRoles()).isEmpty();
    }

    @Test
    void toEntity_shouldFallbackToEmailPrefix_whenUsernameNull() {
        UserProfile result = userProfileMapper.toEntity(10L, "test@example.com", null);
        assertThat(result.getUsername()).isEqualTo("test");
    }

    @Test
    void toDto_shouldFallbackToEmailPrefix_whenUsernameInDbNull() {
        profile.setUsername(null);
        UserProfileResponseDto result = userProfileMapper.toDto(profile);
        assertThat(result.getUsername()).isEqualTo("john.doe");
    }

    @Test
    void updateEntity_shouldNotUpdateUsername_whenRequestUsernameBlank() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto(" ", "Name", "Bio", "123", "Java");
        userProfileMapper.updateEntity(profile, request);
        assertThat(profile.getUsername()).isEqualTo("jdoe");
    }

    @Test
    void updateEntity_shouldSetProfileIncomplete_whenSkillsEmpty() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("user", "Name", "Bio", "123", "");
        userProfileMapper.updateEntity(profile, request);
        assertThat(profile.getProfileComplete()).isFalse();
    }

    @Test
    void updateEntity_shouldSetProfileIncomplete_whenSkillsNull() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("user", "Name", "Bio", "123", null);
        userProfileMapper.updateEntity(profile, request);
        assertThat(profile.getProfileComplete()).isFalse();
    }

    @Test
    void toAdminDto_shouldUseLocalRating_whenClientDataNull() {
        ApiResponse<MentorRatingDto> apiResponse = new ApiResponse<>(true, "Success", null, 200);
        when(reviewClient.getMentorRating(anyLong())).thenReturn(apiResponse);
        when(authClient.getUserRoles(anyLong())).thenReturn(Collections.emptySet());

        UserProfileAdminResponseDto result = userProfileMapper.toAdminDto(profile);
        assertThat(result.getRating()).isEqualTo(4.5);
    }

    @Test
    void toAdminDto_shouldUseLocalRating_whenClientSuccessFalse() {
        ApiResponse<MentorRatingDto> apiResponse = new ApiResponse<>(false, "Error", null, 400);
        when(reviewClient.getMentorRating(anyLong())).thenReturn(apiResponse);
        when(authClient.getUserRoles(anyLong())).thenReturn(Collections.emptySet());

        UserProfileAdminResponseDto result = userProfileMapper.toAdminDto(profile);
        assertThat(result.getRating()).isEqualTo(4.5);
    }

    @Test
    void toAdminDto_shouldHandleNullRolesFromAuth() {
        when(authClient.getUserRoles(anyLong())).thenReturn(null);
        UserProfileAdminResponseDto result = userProfileMapper.toAdminDto(profile);
        assertThat(result.getRoles()).isEmpty();
    }

    @Test
    void updateEntity_shouldSetProfileIncomplete_whenNameNull() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("user", null, "Bio", "123", "Java");
        userProfileMapper.updateEntity(profile, request);
        assertThat(profile.getProfileComplete()).isFalse();
    }

    @Test
    void toAdminDto_shouldHandleEmptyRolesFromAuth() {
        when(authClient.getUserRoles(anyLong())).thenReturn(java.util.Collections.emptySet());
        UserProfileAdminResponseDto result = userProfileMapper.toAdminDto(profile);
        assertThat(result.getRoles()).isEmpty();
    }

    @Test
    void toAdminDto_shouldHandleNullRatingResponse() {
        when(reviewClient.getMentorRating(anyLong())).thenReturn(null);
        when(authClient.getUserRoles(anyLong())).thenReturn(java.util.Collections.emptySet());
        
        UserProfileAdminResponseDto result = userProfileMapper.toAdminDto(profile);
        assertThat(result.getRating()).isEqualTo(4.5);
    }

    @Test
    void toAdminDto_shouldFallbackToEmailPrefix_whenUsernameNull() {
        profile.setUsername(null);
        when(reviewClient.getMentorRating(anyLong())).thenReturn(null);
        when(authClient.getUserRoles(anyLong())).thenReturn(java.util.Collections.emptySet());
        UserProfileAdminResponseDto result = userProfileMapper.toAdminDto(profile);
        assertThat(result.getUsername()).isEqualTo("john.doe");
    }

    @Test
    void toAdminDto_shouldFallbackToEmailPrefix_whenUsernameBlank() {
        profile.setUsername("   ");
        when(reviewClient.getMentorRating(anyLong())).thenReturn(null);
        when(authClient.getUserRoles(anyLong())).thenReturn(java.util.Collections.emptySet());
        UserProfileAdminResponseDto result = userProfileMapper.toAdminDto(profile);
        assertThat(result.getUsername()).isEqualTo("john.doe");
    }

    @Test
    void updateEntity_shouldNotUpdateUsername_whenRequestUsernameEmpty() {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("", "Name", "Bio", "123", "Java");
        userProfileMapper.updateEntity(profile, request);
        assertThat(profile.getUsername()).isEqualTo("jdoe");
    }

    @Test
    void toDto_shouldFallbackToEmailPrefix_whenUsernameBlank() {
        profile.setUsername("   ");
        UserProfileResponseDto result = userProfileMapper.toDto(profile);
        assertThat(result.getUsername()).isEqualTo("john.doe");
    }
}

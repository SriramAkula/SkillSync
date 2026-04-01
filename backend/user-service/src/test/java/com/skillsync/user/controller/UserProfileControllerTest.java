package com.skillsync.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.exception.UserProfileNotFoundException;
import com.skillsync.user.service.UserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = UserProfileController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = com.skillsync.user.filter.GatewayRequestFilter.class
    )
)
class UserProfileControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean UserProfileService userProfileService;

    private UserProfileResponseDto responseDto;

    @BeforeEach
    void setUp() {
        responseDto = new UserProfileResponseDto();
        responseDto.setId(1L);
        responseDto.setUserId(10L);
        responseDto.setEmail("user@example.com");
        responseDto.setName("John Doe");
    }

    // ─── GET /user/profile ───────────────────────────────────────────────────

    @Test
    void getProfile_shouldReturn200_whenValidRequest() throws Exception {
        when(userProfileService.getProfileByUserId(10L)).thenReturn(responseDto);

        mockMvc.perform(get("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value(10))
                .andExpect(jsonPath("$.message").value("Profile fetched successfully"));
    }

    @Test
    void getProfile_shouldReturn403_whenRolesHeaderMissing() throws Exception {
        mockMvc.perform(get("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isForbidden());

        verify(userProfileService, never()).getProfileByUserId(anyLong());
    }

    @Test
    void getProfile_shouldReturn403_whenRolesHeaderEmpty() throws Exception {
        mockMvc.perform(get("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isForbidden());

        verify(userProfileService, never()).getProfileByUserId(anyLong());
    }

    @Test
    void getProfile_shouldReturn404_whenProfileNotFound() throws Exception {
        when(userProfileService.getProfileByUserId(10L))
                .thenThrow(new UserProfileNotFoundException("Not found"));

        mockMvc.perform(get("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /user/profile/{userId} ──────────────────────────────────────────

    @Test
    void getUserProfile_shouldReturn200_whenProfileExists() throws Exception {
        when(userProfileService.getProfileByUserId(10L)).thenReturn(responseDto);

        mockMvc.perform(get("/user/profile/10")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value(10));
    }

    @Test
    void getUserProfile_shouldReturn404_whenProfileNotFound() throws Exception {
        when(userProfileService.getProfileByUserId(99L))
                .thenThrow(new UserProfileNotFoundException("Not found"));

        mockMvc.perform(get("/user/profile/99")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isNotFound());
    }

    // ─── PUT /user/profile ───────────────────────────────────────────────────

    @Test
    void updateProfile_shouldReturn200_whenValidRequest() throws Exception {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("Jane Doe", "bio", "123", "Java");
        when(userProfileService.updateProfile(eq(10L), any())).thenReturn(responseDto);

        mockMvc.perform(put("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile updated successfully"));
    }

    @Test
    void updateProfile_shouldReturn403_whenRolesMissing() throws Exception {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("Jane", "bio", "123", "Java");

        mockMvc.perform(put("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(userProfileService, never()).updateProfile(anyLong(), any());
    }

    @Test
    void updateProfile_shouldReturn403_whenRolesEmpty() throws Exception {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("Jane", "bio", "123", "Java");

        mockMvc.perform(put("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateProfile_shouldReturn400_whenNameBlank() throws Exception {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("", "bio", "123", "Java");

        mockMvc.perform(put("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateProfile_shouldReturn404_whenProfileNotFound() throws Exception {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("Jane", "bio", "123", "Java");
        when(userProfileService.updateProfile(eq(10L), any()))
                .thenThrow(new UserProfileNotFoundException("Not found"));

        mockMvc.perform(put("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    // ─── POST /user/internal/users ───────────────────────────────────────────

    @Test
    void createUserProfile_shouldReturn201_whenValidData() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", 10);
        userData.put("email", "user@example.com");
        when(userProfileService.getProfileByUserId(10L))
                .thenThrow(new UserProfileNotFoundException("Not found"));

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isCreated());

        verify(userProfileService).createProfile(10L, "user@example.com");
    }

    @Test
    void createUserProfile_shouldReturn200_whenProfileAlreadyExists() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", 10);
        userData.put("email", "user@example.com");
        when(userProfileService.getProfileByUserId(10L)).thenReturn(responseDto);

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isOk());

        verify(userProfileService, never()).createProfile(anyLong(), anyString());
    }

    @Test
    void createUserProfile_shouldReturn400_whenUserDataEmpty() throws Exception {
        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUserProfile_shouldReturn400_whenUserIdMissing() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("email", "user@example.com");

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUserProfile_shouldReturn400_whenEmailMissing() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", 10);

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUserProfile_shouldReturn500_whenServiceThrows() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", 10);
        userData.put("email", "user@example.com");
        when(userProfileService.getProfileByUserId(10L))
                .thenThrow(new UserProfileNotFoundException("Not found"));
        doThrow(new RuntimeException("DB error"))
                .when(userProfileService).createProfile(10L, "user@example.com");

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isInternalServerError());
    }
}

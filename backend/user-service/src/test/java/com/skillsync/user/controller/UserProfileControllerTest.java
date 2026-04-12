package com.skillsync.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.user.dto.request.UpdateProfileRequestDto;
import com.skillsync.user.dto.request.BlockUserRequest;
import com.skillsync.user.dto.response.UserProfileResponseDto;
import com.skillsync.user.dto.response.UserProfileAdminResponseDto;
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
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
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
    @MockBean com.skillsync.user.util.SecurityContextUtil securityUtil;
    @MockBean com.skillsync.user.service.UserAdminService userAdminService;

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
        when(securityUtil.extractUserId(any())).thenReturn(10L);
        when(userProfileService.getProfileByUserId(anyLong())).thenReturn(responseDto);

        mockMvc.perform(get("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_USER")
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
        when(securityUtil.extractUserId(any())).thenReturn(10L);
        when(userProfileService.getProfileByUserId(anyLong()))
                .thenThrow(new UserProfileNotFoundException("Not found"));

        mockMvc.perform(get("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_USER")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /user/profile/{userId} ──────────────────────────────────────────

    @Test
    void getUserProfile_shouldReturn200_whenProfileExists() throws Exception {
        when(userProfileService.getProfileByUserId(anyLong())).thenReturn(responseDto);

        mockMvc.perform(get("/user/profile/10")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value(10));
    }

    @Test
    void getUserProfile_shouldReturn404_whenProfileNotFound() throws Exception {
        when(userProfileService.getProfileByUserId(anyLong()))
                .thenThrow(new UserProfileNotFoundException("Not found"));

        mockMvc.perform(get("/user/profile/99")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isNotFound());
    }

    // ─── PUT /user/profile ───────────────────────────────────────────────────

    @Test
    void updateProfile_shouldReturn200_whenValidRequest() throws Exception {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jdoe", "Jane Doe", "bio", "1234567890", "Java");
        when(securityUtil.extractUserId(any())).thenReturn(10L);
        when(userProfileService.updateProfile(anyLong(), any())).thenReturn(responseDto);

        mockMvc.perform(put("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_USER")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profile updated successfully"))
                .andExpect(jsonPath("$.data.userId").value(10))
                .andExpect(jsonPath("$.statusCode").value(200));
    }

    @Test
    void updateProfile_shouldReturn403_whenRolesMissing() throws Exception {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jane", "Jane", "bio", "1234567890", "Java");

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
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jane", "Jane", "bio", "1234567890", "Java");

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
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jane", "", "bio", "1234567890", "Java");

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
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jane", "Jane", "bio", "1234567890", "Java");
        when(securityUtil.extractUserId(any())).thenReturn(10L);
        when(userProfileService.updateProfile(anyLong(), any()))
                .thenThrow(new UserProfileNotFoundException("Not found"));

        mockMvc.perform(put("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_USER")
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
        userData.put("username", "user");
        when(userProfileService.getProfileByUserId(10L))
                .thenThrow(new UserProfileNotFoundException("Not found"));

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isCreated());

        verify(userProfileService).createProfile(10L, "user@example.com", "user");
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

        verify(userProfileService, never()).createProfile(anyLong(), anyString(), anyString());
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
        userData.put("username", "user");
        when(userProfileService.getProfileByUserId(10L))
                .thenThrow(new UserProfileNotFoundException("Not found"));
        doThrow(new RuntimeException("DB error"))
                .when(userProfileService).createProfile(10L, "user@example.com", "user");

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isInternalServerError());
    }

    // ─── GET /user/internal/users/{userId} ───────────────────────────────────

    @Test
    void getInternalUserProfile_shouldReturn200() throws Exception {
        when(userProfileService.getProfileByUserId(10L)).thenReturn(responseDto);

        mockMvc.perform(get("/user/internal/users/10")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value(10));
    }

    // ─── ADMIN ENDPOINTS ─────────────────────────────────────────────────────

    @Test
    void getAllUsers_shouldReturn200_whenAdmin() throws Exception {
        when(userAdminService.getAllUsers(anyInt(), anyInt())).thenReturn(Page.empty());

        mockMvc.perform(get("/user/admin/all")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk());
    }

    @Test
    void getAllUsers_shouldReturn403_whenNotAdmin() throws Exception {
        mockMvc.perform(get("/user/admin/all")
                        .header("roles", "ROLE_USER")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getBlockedUsers_shouldReturn200_whenAdmin() throws Exception {
        when(userAdminService.getBlockedUsers()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/user/admin/blocked")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk());
    }

    @Test
    void blockUser_shouldReturn200_whenAdmin() throws Exception {
        BlockUserRequest blockRequest = new BlockUserRequest("Spam");
        UserProfileAdminResponseDto adminResponse = new UserProfileAdminResponseDto();
        adminResponse.setUserId(10L);
        adminResponse.setIsBlocked(true);

        when(userAdminService.blockUser(anyLong(), anyString(), anyLong())).thenReturn(adminResponse);

        mockMvc.perform(put("/user/admin/10/block")
                        .header("X-User-Id", 1L)
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isBlocked").value(true));
    }

    @Test
    void unblockUser_shouldReturn200_whenAdmin() throws Exception {
        UserProfileAdminResponseDto adminResponse = new UserProfileAdminResponseDto();
        adminResponse.setUserId(10L);
        adminResponse.setIsBlocked(false);

        when(userAdminService.unblockUser(anyLong(), anyLong())).thenReturn(adminResponse);

        mockMvc.perform(put("/user/admin/10/unblock")
                        .header("X-User-Id", 1L)
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isBlocked").value(false));
    }

    @Test
    void getUserDetails_shouldReturn200_whenAdmin() throws Exception {
        UserProfileAdminResponseDto adminResponse = new UserProfileAdminResponseDto();
        adminResponse.setUserId(10L);

        when(userAdminService.getUserDetails(10L)).thenReturn(adminResponse);

        mockMvc.perform(get("/user/admin/10/details")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value(10));
    }

    // ─── Missing Unidentified User Branches ───────────────────────────────────

    @Test
    void createUserProfile_shouldReturn201_whenProfileCheckReturnsNull() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", 10);
        userData.put("email", "user@example.com");
        when(userProfileService.getProfileByUserId(10L)).thenReturn(null);

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isCreated());

        verify(userProfileService).createProfile(10L, "user@example.com", null);
    }



    @Test
    void getProfile_shouldReturn401_whenUserIdUnidentified() throws Exception {
        when(securityUtil.extractUserId(any())).thenReturn(null);
        mockMvc.perform(get("/user/profile")
                        .header("roles", "ROLE_USER")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfile_shouldReturn401_whenUserIdUnidentified() throws Exception {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jdoe", "Jane Doe", "bio", "1234567890", "Java");
        when(securityUtil.extractUserId(any())).thenReturn(null);
        mockMvc.perform(put("/user/profile")
                        .header("roles", "ROLE_USER")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ─── Internal Endpoint Edge Cases ─────────────────────────────────────────

    @Test
    void createUserProfile_shouldReturn400_whenUserIdObjNull() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("email", "test@test.com");
        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUserProfile_shouldReturn400_whenEmailInternalNull() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", 10);
        userData.put("email", null);
        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUserProfile_shouldReturn400_whenNpeOccurs() throws Exception {
        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\": null}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUserProfile_shouldReturn400_whenUserDataNull() throws Exception {
        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    // ─── Admin Role missing branches ─────────────────────────────────────────

    @Test
    void getAllUsers_shouldReturn403_whenRolesHeaderNull() throws Exception {
        mockMvc.perform(get("/user/admin/all")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getBlockedUsers_shouldReturn403_whenRolesHeaderNull() throws Exception {
        mockMvc.perform(get("/user/admin/blocked")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isForbidden());
    }

    @Test
    void createUserProfile_shouldReturn400_whenEmailMissing_Explicit() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", 10);
        // email skipped

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUserProfile_shouldReturn201_whenProfileExistenceCheckThrows() throws Exception {
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", 10L);
        userData.put("email", "user@example.com");
        
        // Mock getProfileByUserId to throw internal exception inside the existence check try block
        when(userProfileService.getProfileByUserId(10L)).thenThrow(new RuntimeException("Check failed"));

        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userData)))
                .andExpect(status().isCreated());

        verify(userProfileService).createProfile(anyLong(), anyString(), any());
    }

    @Test
    void updateProfile_shouldFallbackToHeaderUserId_whenSecurityReturnsNull() throws Exception {
        UpdateProfileRequestDto request = new UpdateProfileRequestDto("jdoe", "Jane Doe", "bio", "1234567890", "Java");
        when(securityUtil.extractUserId(any())).thenReturn(null);
        when(userProfileService.updateProfile(eq(10L), any())).thenReturn(responseDto);

        mockMvc.perform(put("/user/profile")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_USER")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void createUserProfile_shouldReturn500_whenMalformedData() throws Exception {
        // "not-a-number" causes ClassCastException in (Number) cast, which hits catch(Exception) -> 500
        mockMvc.perform(post("/user/internal/users")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\": \"not-a-number\"}"))
                .andExpect(status().isInternalServerError());
    }
}

package com.skillsync.mentor.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.mentor.dto.request.ApplyMentorRequestDto;
import com.skillsync.mentor.dto.request.UpdateAvailabilityRequestDto;
import com.skillsync.mentor.dto.response.MentorProfileResponseDto;
import com.skillsync.mentor.exception.MentorAlreadyExistsException;
import com.skillsync.mentor.exception.MentorNotFoundException;
import com.skillsync.mentor.service.MentorService;

@WebMvcTest(
    controllers = MentorController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = com.skillsync.mentor.filter.GatewayRequestFilter.class
    )
)
class MentorControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean MentorService mentorService;

    private MentorProfileResponseDto mentorResponse;

    @BeforeEach
    void setUp() {
        mentorResponse = MentorProfileResponseDto.builder()
                .id(1L).userId(10L).status("PENDING")
                .isApproved(false).specialization("Java")
                .yearsOfExperience(5).hourlyRate(50.0)
                .rating(0.0).totalStudents(0)
                .availabilityStatus("AVAILABLE")
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
    }

    // ─── POST /mentor/apply ──────────────────────────────────────────────────

    @Test
    void applyAsMentor_shouldReturn201_whenLearnerRole() throws Exception {
        ApplyMentorRequestDto request = new ApplyMentorRequestDto();
        request.setSpecialization("Java");
        request.setYearsOfExperience(5);
        request.setHourlyRate(50.0);
        request.setBio("Experienced Java developer with 5 years");
        when(mentorService.applyAsMentor(eq(10L), any())).thenReturn(mentorResponse);

        mockMvc.perform(post("/mentor/apply")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.specialization").value("Java"));
    }

    @Test
    void applyAsMentor_shouldReturn403_whenNotLearner() throws Exception {
        ApplyMentorRequestDto request = new ApplyMentorRequestDto();
        request.setSpecialization("Java");
        request.setYearsOfExperience(5);
        request.setHourlyRate(50.0);
        request.setBio("Experienced Java developer with 5 years");

        mockMvc.perform(post("/mentor/apply")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_MENTOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(mentorService, never()).applyAsMentor(anyLong(), any());
    }

    @Test
    void applyAsMentor_shouldReturn400_whenSpecializationBlank() throws Exception {
        ApplyMentorRequestDto request = new ApplyMentorRequestDto();
        request.setSpecialization("");
        request.setYearsOfExperience(5);
        request.setHourlyRate(50.0);
        request.setBio("Experienced Java developer with 5 years");

        mockMvc.perform(post("/mentor/apply")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void applyAsMentor_shouldReturn409_whenAlreadyApplied() throws Exception {
        ApplyMentorRequestDto request = new ApplyMentorRequestDto();
        request.setSpecialization("Java");
        request.setYearsOfExperience(5);
        request.setHourlyRate(50.0);
        request.setBio("Experienced Java developer with 5 years");
        when(mentorService.applyAsMentor(eq(10L), any()))
                .thenThrow(new MentorAlreadyExistsException("Already applied"));

        mockMvc.perform(post("/mentor/apply")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    // ─── GET /mentor/{mentorId} ──────────────────────────────────────────────

    @Test
    void getMentorProfile_shouldReturn200_whenExists() throws Exception {
        when(mentorService.getMentorProfile(1L)).thenReturn(mentorResponse);

        mockMvc.perform(get("/mentor/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.specialization").value("Java"));
    }

    @Test
    void getMentorProfile_shouldReturn404_whenNotFound() throws Exception {
        when(mentorService.getMentorProfile(99L)).thenThrow(new MentorNotFoundException("Not found"));

        mockMvc.perform(get("/mentor/99"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /mentor/profile/me ──────────────────────────────────────────────

    @Test
    void getMyMentorProfile_shouldReturn200_whenExists() throws Exception {
        when(mentorService.getMentorByUserId(10L)).thenReturn(mentorResponse);

        mockMvc.perform(get("/mentor/profile/me")
                        .header("X-User-Id", 10L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value(10));
    }

    @Test
    void getMyMentorProfile_shouldReturn404_whenNotFound() throws Exception {
        when(mentorService.getMentorByUserId(99L)).thenThrow(new MentorNotFoundException("Not found"));

        mockMvc.perform(get("/mentor/profile/me")
                        .header("X-User-Id", 99L))
                .andExpect(status().isNotFound());
    }

    // ─── GET /mentor/approved ────────────────────────────────────────────────

    @Test
    void getAllApprovedMentors_shouldReturn200_withList() throws Exception {
        when(mentorService.getAllApprovedMentors()).thenReturn(List.of(mentorResponse));

        mockMvc.perform(get("/mentor/approved"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(1));
    }

    @Test
    void getAllApprovedMentors_shouldReturn200_withEmptyList() throws Exception {
        when(mentorService.getAllApprovedMentors()).thenReturn(List.of());

        mockMvc.perform(get("/mentor/approved"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ─── GET /mentor/pending ─────────────────────────────────────────────────

    @Test
    void getPendingApplications_shouldReturn200_whenAdminRole() throws Exception {
        when(mentorService.getPendingApplications()).thenReturn(List.of(mentorResponse));

        mockMvc.perform(get("/mentor/pending")
                        .header("roles", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("PENDING"));
    }

    @Test
    void getPendingApplications_shouldReturn403_whenNotAdmin() throws Exception {
        mockMvc.perform(get("/mentor/pending")
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isForbidden());
    }

    // ─── GET /mentor/search ──────────────────────────────────────────────────

    @Test
    void searchMentors_shouldReturn200_withResults() throws Exception {
        when(mentorService.searchMentorsBySpecialization("Java")).thenReturn(List.of(mentorResponse));

        mockMvc.perform(get("/mentor/search").param("skill", "Java"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].specialization").value("Java"));
    }

    @Test
    void searchMentors_shouldReturn200_withEmptyResults() throws Exception {
        when(mentorService.searchMentorsBySpecialization("Unknown")).thenReturn(List.of());

        mockMvc.perform(get("/mentor/search").param("skill", "Unknown"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ─── PUT /mentor/{mentorId}/approve ──────────────────────────────────────

    @Test
    void approveMentor_shouldReturn200_whenAdminRole() throws Exception {
        MentorProfileResponseDto approved = MentorProfileResponseDto.builder()
                .id(1L).userId(10L).status("APPROVED").isApproved(true)
                .specialization("Java").yearsOfExperience(5).hourlyRate(50.0)
                .rating(0.0).totalStudents(0).availabilityStatus("AVAILABLE")
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        when(mentorService.approveMentor(1L, 99L)).thenReturn(approved);

        // MentorProfileResponseDto has manual getIsApproved() getter -> Jackson serializes as "isApproved"
        mockMvc.perform(put("/mentor/1/approve")
                        .header("X-User-Id", 99L)
                        .header("roles", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isApproved").value(true));
    }

    @Test
    void approveMentor_shouldReturn403_whenNotAdmin() throws Exception {
        mockMvc.perform(put("/mentor/1/approve")
                        .header("X-User-Id", 99L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void approveMentor_shouldReturn404_whenMentorNotFound() throws Exception {
        when(mentorService.approveMentor(99L, 1L)).thenThrow(new MentorNotFoundException("Not found"));

        mockMvc.perform(put("/mentor/99/approve")
                        .header("X-User-Id", 1L)
                        .header("roles", "ROLE_ADMIN"))
                .andExpect(status().isNotFound());
    }

    // ─── PUT /mentor/{mentorId}/reject ───────────────────────────────────────

    @Test
    void rejectMentor_shouldReturn200_whenAdminRole() throws Exception {
        when(mentorService.rejectMentor(1L, 99L)).thenReturn(mentorResponse);

        mockMvc.perform(put("/mentor/1/reject")
                        .header("X-User-Id", 99L)
                        .header("roles", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Mentor rejected successfully"));
    }

    @Test
    void rejectMentor_shouldReturn403_whenNotAdmin() throws Exception {
        mockMvc.perform(put("/mentor/1/reject")
                        .header("X-User-Id", 99L)
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isForbidden());
    }

    // ─── PUT /mentor/availability ────────────────────────────────────────────

    @Test
    void updateAvailability_shouldReturn200_whenMentorRole() throws Exception {
        UpdateAvailabilityRequestDto request = new UpdateAvailabilityRequestDto();
        request.setAvailabilityStatus("BUSY");
        when(mentorService.updateAvailability(eq(10L), any())).thenReturn(mentorResponse);

        mockMvc.perform(put("/mentor/availability")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_MENTOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Availability updated successfully"));
    }

    @Test
    void updateAvailability_shouldReturn403_whenNotMentor() throws Exception {
        UpdateAvailabilityRequestDto request = new UpdateAvailabilityRequestDto();
        request.setAvailabilityStatus("BUSY");

        mockMvc.perform(put("/mentor/availability")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateAvailability_shouldReturn400_whenStatusNull() throws Exception {
        UpdateAvailabilityRequestDto request = new UpdateAvailabilityRequestDto();
        request.setAvailabilityStatus(null);

        mockMvc.perform(put("/mentor/availability")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_MENTOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ─── PUT /mentor/{mentorId}/suspend ──────────────────────────────────────

    @Test
    void suspendMentor_shouldReturn200_whenAdminRole() throws Exception {
        when(mentorService.suspendMentor(1L, 99L)).thenReturn(mentorResponse);

        mockMvc.perform(put("/mentor/1/suspend")
                        .header("X-User-Id", 99L)
                        .header("roles", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Mentor suspended successfully"));
    }

    @Test
    void suspendMentor_shouldReturn403_whenNotAdmin() throws Exception {
        mockMvc.perform(put("/mentor/1/suspend")
                        .header("X-User-Id", 99L)
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isForbidden());
    }

    // ─── PUT /mentor/{mentorId}/rating ───────────────────────────────────────

    @Test
    void updateRating_shouldReturn200() throws Exception {
        doNothing().when(mentorService).updateMentorRating(1L, 4.5);

        mockMvc.perform(put("/mentor/1/rating").param("newRating", "4.5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Rating updated successfully"));
    }

    @Test
    void updateRating_shouldReturn404_whenMentorNotFound() throws Exception {
        doThrow(new MentorNotFoundException("Not found"))
                .when(mentorService).updateMentorRating(99L, 4.5);

        mockMvc.perform(put("/mentor/99/rating").param("newRating", "4.5"))
                .andExpect(status().isNotFound());
    }
}

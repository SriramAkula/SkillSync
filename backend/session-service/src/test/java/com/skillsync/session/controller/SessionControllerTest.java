package com.skillsync.session.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.exception.SessionConflictException;
import com.skillsync.session.exception.SessionNotFoundException;
import com.skillsync.session.service.SessionService;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = SessionController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    },
    excludeFilters = @org.springframework.context.annotation.ComponentScan.Filter(
        type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
        classes = com.skillsync.session.filter.GatewayRequestFilter.class
    )
)
class SessionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean SessionService sessionService;

    private SessionResponseDto sessionResponse;
    private RequestSessionRequestDto sessionRequest;

    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.now();
        sessionResponse = new SessionResponseDto(
                1L, 5L, 10L, 3L, now.plusDays(1), 60, "REQUESTED", null, now, now);

        sessionRequest = new RequestSessionRequestDto();
        sessionRequest.setMentorId(5L);
        sessionRequest.setSkillId(3L);
        sessionRequest.setScheduledAt(LocalDateTime.now().plusDays(1));
        sessionRequest.setDurationMinutes(60);
    }

    // ─── POST /session/request ───────────────────────────────────────────────

    @Test
    void requestSession_shouldReturn201_whenLearnerRole() throws Exception {
        when(sessionService.requestSession(eq(10L), any())).thenReturn(sessionResponse);

        mockMvc.perform(post("/session/request")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sessionRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("REQUESTED"));
    }

    @Test
    void requestSession_shouldReturn403_whenNotLearner() throws Exception {
        mockMvc.perform(post("/session/request")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_MENTOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sessionRequest)))
                .andExpect(status().isForbidden());

        verify(sessionService, never()).requestSession(anyLong(), any());
    }

    @Test
    void requestSession_shouldReturn409_whenConflict() throws Exception {
        when(sessionService.requestSession(eq(10L), any()))
                .thenThrow(new SessionConflictException("Time conflict"));

        mockMvc.perform(post("/session/request")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sessionRequest)))
                .andExpect(status().isConflict());
    }

    // ─── GET /session/{sessionId} ────────────────────────────────────────────

    @Test
    void getSession_shouldReturn200_whenRequested() throws Exception {
        when(sessionService.getSession(1L)).thenReturn(sessionResponse);

        mockMvc.perform(get("/session/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void getSession_shouldReturn404_whenNotFound() throws Exception {
        when(sessionService.getSession(99L)).thenThrow(new SessionNotFoundException("Not found"));

        mockMvc.perform(get("/session/99"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /session/mentor/list ────────────────────────────────────────────

    @Test
    void getMentorSessions_shouldReturn200_whenMentorRole() throws Exception {
        when(sessionService.getSessionsForMentor(5L)).thenReturn(List.of(sessionResponse));

        mockMvc.perform(get("/session/mentor/list")
                        .header("X-User-Id", 5L)
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].mentorId").value(5));
    }

    @Test
    void getMentorSessions_shouldReturn403_whenNotMentor() throws Exception {
        mockMvc.perform(get("/session/mentor/list")
                        .header("X-User-Id", 5L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isForbidden());
    }

    // ─── GET /session/learner/list ───────────────────────────────────────────

    @Test
    void getLearnerSessions_shouldReturn200_whenLearnerRole() throws Exception {
        when(sessionService.getSessionsForLearner(10L)).thenReturn(List.of(sessionResponse));

        mockMvc.perform(get("/session/learner/list")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].learnerId").value(10));
    }

    @Test
    void getLearnerSessions_shouldReturn403_whenNotLearner() throws Exception {
        mockMvc.perform(get("/session/learner/list")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isForbidden());
    }

    // ─── PUT /session/{sessionId}/accept ─────────────────────────────────────

    @Test
    void acceptSession_shouldReturn200_whenMentorRole() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        SessionResponseDto accepted = new SessionResponseDto(
                1L, 5L, 10L, 3L, now.plusDays(1), 60, "ACCEPTED", null, now, now);
        when(sessionService.acceptSession(1L)).thenReturn(accepted);

        mockMvc.perform(put("/session/1/accept")
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }

    @Test
    void acceptSession_shouldReturn403_whenNotMentor() throws Exception {
        mockMvc.perform(put("/session/1/accept")
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void acceptSession_shouldReturn409_whenAlreadyProcessed() throws Exception {
        when(sessionService.acceptSession(1L)).thenThrow(new SessionConflictException("Already processed"));

        mockMvc.perform(put("/session/1/accept")
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isConflict());
    }

    // ─── PUT /session/{sessionId}/reject ─────────────────────────────────────

    @Test
    void rejectSession_shouldReturn200_whenMentorRole() throws Exception {
        when(sessionService.rejectSession(1L, "Not available")).thenReturn(sessionResponse);

        mockMvc.perform(put("/session/1/reject")
                        .header("roles", "ROLE_MENTOR")
                        .param("reason", "Not available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Session rejected successfully"));
    }

    @Test
    void rejectSession_shouldReturn403_whenNotMentor() throws Exception {
        mockMvc.perform(put("/session/1/reject")
                        .header("roles", "ROLE_LEARNER")
                        .param("reason", "Not available"))
                .andExpect(status().isForbidden());
    }

    // ─── PUT /session/{sessionId}/cancel ─────────────────────────────────────

    @Test
    void cancelSession_shouldReturn200_whenLearnerRole() throws Exception {
        when(sessionService.cancelSession(1L)).thenReturn(sessionResponse);

        mockMvc.perform(put("/session/1/cancel")
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Session cancelled successfully"));
    }

    @Test
    void cancelSession_shouldReturn200_whenMentorRole() throws Exception {
        when(sessionService.cancelSession(1L)).thenReturn(sessionResponse);

        mockMvc.perform(put("/session/1/cancel")
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isOk());
    }

    @Test
    void cancelSession_shouldReturn403_whenNoValidRole() throws Exception {
        mockMvc.perform(put("/session/1/cancel")
                        .header("roles", "ROLE_ADMIN"))
                .andExpect(status().isForbidden());
    }

    @Test
    void cancelSession_shouldReturn404_whenNotFound() throws Exception {
        when(sessionService.cancelSession(99L)).thenThrow(new SessionNotFoundException("Not found"));

        mockMvc.perform(put("/session/99/cancel")
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isNotFound());
    }
}

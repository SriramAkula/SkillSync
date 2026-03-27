package com.skillsync.session.service;

import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.exception.SessionConflictException;
import com.skillsync.session.exception.SessionNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock private SessionService sessionService;

    private SessionResponseDto requestedSession;
    private SessionResponseDto acceptedSession;
    private RequestSessionRequestDto sessionRequest;

    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);
        
        requestedSession = new SessionResponseDto(
                1L, 5L, 10L, 3L, tomorrow, 60, "REQUESTED", null, now, now);

        acceptedSession = new SessionResponseDto(
                1L, 5L, 10L, 3L, tomorrow, 60, "ACCEPTED", null, now, now);

        sessionRequest = new RequestSessionRequestDto();
        sessionRequest.setMentorId(5L);
        sessionRequest.setSkillId(3L);
        sessionRequest.setScheduledAt(LocalDateTime.now().plusDays(1));
        sessionRequest.setDurationMinutes(60);
    }

    // ─── requestSession ──────────────────────────────────────────────────────

    @Test
    void requestSession_shouldReturnSession_whenValid() {
        when(sessionService.requestSession(10L, sessionRequest)).thenReturn(requestedSession);

        SessionResponseDto result = sessionService.requestSession(10L, sessionRequest);

        assertThat(result.getStatus()).isEqualTo("REQUESTED");
        assertThat(result.getLearnerId()).isEqualTo(10L);
        assertThat(result.getMentorId()).isEqualTo(5L);
    }

    @Test
    void requestSession_shouldThrow_whenTimeConflict() {
        when(sessionService.requestSession(eq(10L), any()))
                .thenThrow(new SessionConflictException("Mentor already has a session at this time"));

        assertThatThrownBy(() -> sessionService.requestSession(10L, sessionRequest))
                .isInstanceOf(SessionConflictException.class)
                .hasMessageContaining("session at this time");
    }

    // ─── getSession ──────────────────────────────────────────────────────────

    @Test
    void getSession_shouldReturnSession_whenExists() {
        when(sessionService.getSession(1L)).thenReturn(requestedSession);

        SessionResponseDto result = sessionService.getSession(1L);

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getSession_shouldThrow_whenNotFound() {
        when(sessionService.getSession(99L)).thenThrow(new SessionNotFoundException("Not found"));

        assertThatThrownBy(() -> sessionService.getSession(99L))
                .isInstanceOf(SessionNotFoundException.class);
    }

    // ─── getSessionsForMentor ────────────────────────────────────────────────

    @Test
    void getSessionsForMentor_shouldReturnList_whenSessionsExist() {
        when(sessionService.getSessionsForMentor(5L)).thenReturn(List.of(requestedSession));

        List<SessionResponseDto> result = sessionService.getSessionsForMentor(5L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getMentorId()).isEqualTo(5L);
    }

    @Test
    void getSessionsForMentor_shouldReturnEmpty_whenNoSessions() {
        when(sessionService.getSessionsForMentor(99L)).thenReturn(List.of());

        assertThat(sessionService.getSessionsForMentor(99L)).isEmpty();
    }

    // ─── getSessionsForLearner ───────────────────────────────────────────────

    @Test
    void getSessionsForLearner_shouldReturnList_whenSessionsExist() {
        when(sessionService.getSessionsForLearner(10L)).thenReturn(List.of(requestedSession));

        List<SessionResponseDto> result = sessionService.getSessionsForLearner(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLearnerId()).isEqualTo(10L);
    }

    @Test
    void getSessionsForLearner_shouldReturnEmpty_whenNoSessions() {
        when(sessionService.getSessionsForLearner(99L)).thenReturn(List.of());

        assertThat(sessionService.getSessionsForLearner(99L)).isEmpty();
    }

    // ─── acceptSession ───────────────────────────────────────────────────────

    @Test
    void acceptSession_shouldReturnAccepted_whenPending() {
        when(sessionService.acceptSession(1L)).thenReturn(acceptedSession);

        SessionResponseDto result = sessionService.acceptSession(1L);

        assertThat(result.getStatus()).isEqualTo("ACCEPTED");
    }

    @Test
    void acceptSession_shouldThrow_whenNotFound() {
        when(sessionService.acceptSession(99L)).thenThrow(new SessionNotFoundException("Not found"));

        assertThatThrownBy(() -> sessionService.acceptSession(99L))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void acceptSession_shouldThrow_whenAlreadyProcessed() {
        when(sessionService.acceptSession(1L)).thenThrow(new SessionConflictException("Already processed"));

        assertThatThrownBy(() -> sessionService.acceptSession(1L))
                .isInstanceOf(SessionConflictException.class);
    }

    // ─── rejectSession ───────────────────────────────────────────────────────

    @Test
    void rejectSession_shouldReturnRejected_whenPending() {
        LocalDateTime now = LocalDateTime.now();
        SessionResponseDto rejected = new SessionResponseDto(
                1L, 5L, 10L, 3L, now.plusDays(1), 60, "REJECTED", 
                "Not available", now, now);
        when(sessionService.rejectSession(1L, "Not available")).thenReturn(rejected);

        SessionResponseDto result = sessionService.rejectSession(1L, "Not available");

        assertThat(result.getStatus()).isEqualTo("REJECTED");
        assertThat(result.getRejectionReason()).isEqualTo("Not available");
    }

    @Test
    void rejectSession_shouldThrow_whenNotFound() {
        when(sessionService.rejectSession(99L, "reason"))
                .thenThrow(new SessionNotFoundException("Not found"));

        assertThatThrownBy(() -> sessionService.rejectSession(99L, "reason"))
                .isInstanceOf(SessionNotFoundException.class);
    }

    // ─── cancelSession ───────────────────────────────────────────────────────

    @Test
    void cancelSession_shouldReturnCancelled_whenValid() {
        LocalDateTime now = LocalDateTime.now();
        SessionResponseDto cancelled = new SessionResponseDto(
                1L, 5L, 10L, 3L, now.plusDays(1), 60, "CANCELLED", null, now, now);
        when(sessionService.cancelSession(1L)).thenReturn(cancelled);

        SessionResponseDto result = sessionService.cancelSession(1L);

        assertThat(result.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void cancelSession_shouldThrow_whenNotFound() {
        when(sessionService.cancelSession(99L)).thenThrow(new SessionNotFoundException("Not found"));

        assertThatThrownBy(() -> sessionService.cancelSession(99L))
                .isInstanceOf(SessionNotFoundException.class);
    }

    // ─── getPendingSessions ──────────────────────────────────────────────────

    @Test
    void getPendingSessions_shouldReturnList_whenPendingExist() {
        when(sessionService.getPendingSessions()).thenReturn(List.of(requestedSession));

        List<SessionResponseDto> result = sessionService.getPendingSessions();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("REQUESTED");
    }

    @Test
    void getPendingSessions_shouldReturnEmpty_whenNoPending() {
        when(sessionService.getPendingSessions()).thenReturn(List.of());

        assertThat(sessionService.getPendingSessions()).isEmpty();
    }
}

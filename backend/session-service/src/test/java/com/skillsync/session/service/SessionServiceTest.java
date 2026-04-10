package com.skillsync.session.service;

import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.entity.Session;
import com.skillsync.session.entity.SessionStatus;
import com.skillsync.session.exception.SessionConflictException;
import com.skillsync.session.exception.SessionNotFoundException;
import com.skillsync.session.mapper.SessionMapper;
import com.skillsync.session.publisher.SessionEventPublisher;
import com.skillsync.session.repository.SessionRepository;
import com.skillsync.session.service.impl.SessionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.skillsync.session.dto.response.PageResponse;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private SessionEventPublisher eventPublisher;
    @Mock private SessionMapper sessionMapper;

    @InjectMocks private SessionServiceImpl sessionService;

    private Session session;
    private SessionResponseDto requestedDto;
    private SessionResponseDto acceptedDto;
    private RequestSessionRequestDto sessionRequest;

    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);

        session = new Session();
        session.setId(1L);
        session.setMentorId(5L);
        session.setLearnerId(10L);
        session.setSkillId(3L);
        session.setScheduledAt(tomorrow);
        session.setDurationMinutes(60);
        session.setStatus(SessionStatus.REQUESTED);

        requestedDto = new SessionResponseDto(1L, 5L, 10L, 3L, tomorrow, 60, "REQUESTED", null, now, now);
        acceptedDto  = new SessionResponseDto(1L, 5L, 10L, 3L, tomorrow, 60, "ACCEPTED", null, now, now);

        sessionRequest = new RequestSessionRequestDto();
        sessionRequest.setMentorId(5L);
        sessionRequest.setSkillId(3L);
        sessionRequest.setScheduledAt(tomorrow);
        sessionRequest.setDurationMinutes(60);
    }

    // ─── requestSession ──────────────────────────────────────────────────────

    @Test
    void requestSession_shouldReturnSession_whenValid() {
        when(sessionRepository.findSessionsInTimeRange(anyLong(), any(), any())).thenReturn(List.of());
        when(sessionMapper.toEntity(eq(10L), any())).thenReturn(session);
        when(sessionRepository.save(any())).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(requestedDto);

        SessionResponseDto result = sessionService.requestSession(10L, sessionRequest);

        assertThat(result.getStatus()).isEqualTo("REQUESTED");
        assertThat(result.getLearnerId()).isEqualTo(10L);
        assertThat(result.getMentorId()).isEqualTo(5L);
        verify(sessionRepository).save(any());
        verify(eventPublisher).publishSessionRequested(any());
    }

    @Test
    void requestSession_shouldThrow_whenTimeConflict() {
        when(sessionRepository.findSessionsInTimeRange(anyLong(), any(), any()))
                .thenReturn(List.of(session));

        assertThatThrownBy(() -> sessionService.requestSession(10L, sessionRequest))
                .isInstanceOf(SessionConflictException.class)
                .hasMessageContaining("conflicting session");
    }

    // ─── getSession ──────────────────────────────────────────────────────────

    @Test
    void getSession_shouldReturnSession_whenExists() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionMapper.toDto(session)).thenReturn(requestedDto);

        SessionResponseDto result = sessionService.getSession(1L);

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getSession_shouldThrow_whenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.getSession(99L))
                .isInstanceOf(SessionNotFoundException.class);
    }

    // ─── getSessionsForMentor ────────────────────────────────────────────────

    @Test
    void getSessionsForMentor_shouldReturnPageResponse_whenSessionsExist() {
        Page<Session> page = new PageImpl<>(List.of(session), PageRequest.of(0, 10), 1);
        when(sessionRepository.findByMentorId(eq(5L), any(Pageable.class))).thenReturn(page);
        when(sessionMapper.toDto(session)).thenReturn(requestedDto);

        PageResponse<SessionResponseDto> result = sessionService.getSessionsForMentor(5L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void getSessionsForMentor_shouldReturnEmpty_whenNoSessions() {
        when(sessionRepository.findByMentorId(eq(99L), any(Pageable.class))).thenReturn(Page.empty());

        assertThat(sessionService.getSessionsForMentor(99L, 0, 10).getContent()).isEmpty();
    }

    // ─── getSessionsForLearner ───────────────────────────────────────────────

    @Test
    void getSessionsForLearner_shouldReturnPageResponse_whenSessionsExist() {
        Page<Session> page = new PageImpl<>(List.of(session), PageRequest.of(0, 10), 1);
        when(sessionRepository.findByLearnerId(eq(10L), any(Pageable.class))).thenReturn(page);
        when(sessionMapper.toDto(session)).thenReturn(requestedDto);

        PageResponse<SessionResponseDto> result = sessionService.getSessionsForLearner(10L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getSessionsForLearner_shouldReturnEmpty_whenNoSessions() {
        when(sessionRepository.findByLearnerId(eq(99L), any(Pageable.class))).thenReturn(Page.empty());

        assertThat(sessionService.getSessionsForLearner(99L, 0, 10).getContent()).isEmpty();
    }

    // ─── acceptSession ───────────────────────────────────────────────────────

    @Test
    void acceptSession_shouldReturnAccepted_whenRequested() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(acceptedDto);

        SessionResponseDto result = sessionService.acceptSession(1L);

        assertThat(result.getStatus()).isEqualTo("ACCEPTED");
        verify(eventPublisher).publishSessionAccepted(any());
    }

    @Test
    void acceptSession_shouldThrow_whenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.acceptSession(99L))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void acceptSession_shouldThrow_whenAlreadyProcessed() {
        session.setStatus(SessionStatus.ACCEPTED);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.acceptSession(1L))
                .isInstanceOf(SessionConflictException.class)
                .hasMessageContaining("already");
    }

    // ─── rejectSession ───────────────────────────────────────────────────────

    @Test
    void rejectSession_shouldReturnRejected_whenRequested() {
        LocalDateTime now = LocalDateTime.now();
        SessionResponseDto rejectedDto = new SessionResponseDto(
                1L, 5L, 10L, 3L, now.plusDays(1), 60, "REJECTED", "Not available", now, now);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(rejectedDto);

        SessionResponseDto result = sessionService.rejectSession(1L, "Not available");

        assertThat(result.getStatus()).isEqualTo("REJECTED");
        assertThat(result.getRejectionReason()).isEqualTo("Not available");
        verify(eventPublisher).publishSessionRejected(any());
    }

    @Test
    void rejectSession_shouldThrow_whenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.rejectSession(99L, "reason"))
                .isInstanceOf(SessionNotFoundException.class);
    }

    // ─── cancelSession ───────────────────────────────────────────────────────

    @Test
    void cancelSession_shouldReturnCancelled_whenAccepted() {
        session.setStatus(SessionStatus.ACCEPTED);
        LocalDateTime now = LocalDateTime.now();
        SessionResponseDto cancelledDto = new SessionResponseDto(
                1L, 5L, 10L, 3L, now.plusDays(1), 60, "CANCELLED", null, now, now);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(cancelledDto);

        SessionResponseDto result = sessionService.cancelSession(1L);

        assertThat(result.getStatus()).isEqualTo("CANCELLED");
        verify(eventPublisher).publishSessionCancelled(any());
    }

    @Test
    void cancelSession_shouldThrow_whenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.cancelSession(99L))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void cancelSession_shouldThrow_whenNotAccepted() {
        // session is REQUESTED, not ACCEPTED
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.cancelSession(1L))
                .isInstanceOf(SessionConflictException.class)
                .hasMessageContaining("ACCEPTED");
    }

    // ─── getPendingSessions ──────────────────────────────────────────────────

    @Test
    void getPendingSessions_shouldReturnList_whenPendingExist() {
        when(sessionRepository.findPendingSessions()).thenReturn(List.of(session));
        when(sessionMapper.toDto(session)).thenReturn(requestedDto);

        List<SessionResponseDto> result = sessionService.getPendingSessions();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("REQUESTED");
    }

    @Test
    void getPendingSessions_shouldReturnEmpty_whenNoPending() {
        when(sessionRepository.findPendingSessions()).thenReturn(List.of());

        assertThat(sessionService.getPendingSessions()).isEmpty();
    }
}

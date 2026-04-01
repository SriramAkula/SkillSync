package com.skillsync.session.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.entity.Session;
import com.skillsync.session.entity.SessionStatus;
import com.skillsync.session.exception.SessionConflictException;
import com.skillsync.session.exception.SessionNotFoundException;
import com.skillsync.session.mapper.SessionMapper;
import com.skillsync.session.publisher.SessionEventPublisher;
import com.skillsync.session.repository.SessionRepository;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private SessionEventPublisher eventPublisher;
    @Mock private SessionMapper sessionMapper;

    @InjectMocks private SessionServiceImpl sessionService;

    private Session session;
    private RequestSessionRequestDto requestDto;
    private SessionResponseDto requestedDto;
    private SessionResponseDto acceptedDto;
    private SessionResponseDto rejectedDto;
    private SessionResponseDto cancelledDto;

    @BeforeEach
    void setUp() {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        LocalDateTime now = LocalDateTime.now();

        session = new Session();
        session.setId(1L);
        session.setMentorId(100L);
        session.setLearnerId(200L);
        session.setSkillId(10L);
        session.setScheduledAt(tomorrow);
        session.setDurationMinutes(60);
        session.setStatus(SessionStatus.REQUESTED);
        session.setCreatedAt(now);
        session.setUpdatedAt(now);

        requestDto = new RequestSessionRequestDto();
        requestDto.setMentorId(100L);
        requestDto.setSkillId(10L);
        requestDto.setScheduledAt(tomorrow);
        requestDto.setDurationMinutes(60);

        requestedDto  = new SessionResponseDto(1L, 100L, 200L, 10L, tomorrow, 60, "REQUESTED",  null,   now, now);
        acceptedDto   = new SessionResponseDto(1L, 100L, 200L, 10L, tomorrow, 60, "ACCEPTED",   null,   now, now);
        rejectedDto   = new SessionResponseDto(1L, 100L, 200L, 10L, tomorrow, 60, "REJECTED",   "Busy", now, now);
        cancelledDto  = new SessionResponseDto(1L, 100L, 200L, 10L, tomorrow, 60, "CANCELLED",  null,   now, now);
    }

    @Test
    void requestSession_ShouldSucceed_WhenNoConflict() {
        when(sessionRepository.findSessionsInTimeRange(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(sessionMapper.toEntity(eq(200L), any())).thenReturn(session);
        when(sessionRepository.save(any(Session.class))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(requestedDto);

        SessionResponseDto response = sessionService.requestSession(200L, requestDto);

        assertNotNull(response);
        assertEquals(200L, response.getLearnerId());
        assertEquals("REQUESTED", response.getStatus());
        verify(sessionRepository).save(any(Session.class));
        verify(eventPublisher).publishSessionRequested(any());
    }

    @Test
    void requestSession_ShouldThrowConflict_WhenTimeConflict() {
        when(sessionRepository.findSessionsInTimeRange(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(session));

        assertThrows(SessionConflictException.class, () -> sessionService.requestSession(200L, requestDto));
    }

    @Test
    void acceptSession_ShouldSuccess_WhenRequested() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(Session.class))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(acceptedDto);

        SessionResponseDto response = sessionService.acceptSession(1L);

        assertEquals("ACCEPTED", response.getStatus());
        verify(sessionRepository).save(session);
        verify(eventPublisher).publishSessionAccepted(any());
    }

    @Test
    void acceptSession_ShouldThrowConflict_WhenNotRequested() {
        session.setStatus(SessionStatus.ACCEPTED);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThrows(SessionConflictException.class, () -> sessionService.acceptSession(1L));
    }

    @Test
    void rejectSession_ShouldSuccess() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(Session.class))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(rejectedDto);

        SessionResponseDto response = sessionService.rejectSession(1L, "Busy");

        assertEquals("REJECTED", response.getStatus());
        assertEquals("Busy", response.getRejectionReason());
        verify(eventPublisher).publishSessionRejected(any());
    }

    @Test
    void cancelSession_ShouldSuccess() {
        session.setStatus(SessionStatus.ACCEPTED);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(Session.class))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(cancelledDto);

        SessionResponseDto response = sessionService.cancelSession(1L);

        assertEquals("CANCELLED", response.getStatus());
        verify(eventPublisher).publishSessionCancelled(any());
    }

    @Test
    void cancelSession_ShouldThrow_WhenNotAccepted() {
        // session is REQUESTED, not ACCEPTED
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThrows(SessionConflictException.class, () -> sessionService.cancelSession(1L));
    }

    @Test
    void acceptSession_ShouldThrow_WhenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(SessionNotFoundException.class, () -> sessionService.acceptSession(99L));
    }

    @Test
    void rejectSession_ShouldThrow_WhenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(SessionNotFoundException.class, () -> sessionService.rejectSession(99L, "reason"));
    }

    @Test
    void cancelSession_ShouldThrow_WhenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(SessionNotFoundException.class, () -> sessionService.cancelSession(99L));
    }
}

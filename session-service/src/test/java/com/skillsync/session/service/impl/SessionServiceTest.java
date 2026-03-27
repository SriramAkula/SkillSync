package com.skillsync.session.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
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
import com.skillsync.session.repository.SessionRepository;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private SessionServiceImpl sessionService;

    private Session session;
    private RequestSessionRequestDto requestDto;

    @BeforeEach
    void setUp() {
        session = new Session();
        session.setId(1L);
        session.setMentorId(100L);
        session.setLearnerId(200L);
        session.setSkillId(10L);
        session.setScheduledAt(LocalDateTime.now().plusDays(1));
        session.setDurationMinutes(60);
        session.setStatus(SessionStatus.REQUESTED);
        session.setCreatedAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());

        requestDto = new RequestSessionRequestDto();
        requestDto.setMentorId(100L);
        requestDto.setSkillId(10L);
        requestDto.setScheduledAt(LocalDateTime.now().plusDays(1));
        requestDto.setDurationMinutes(60);
    }

    @Test
    void requestSession_ShouldSucceed_WhenNoConflict() {
        // Arrange
        when(sessionRepository.findSessionsInTimeRange(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(java.util.List.of());
        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        // Act
        SessionResponseDto response = sessionService.requestSession(200L, requestDto);

        // Assert
        assertNotNull(response);
        assertEquals(200L, response.getLearnerId());
        verify(sessionRepository, times(1)).save(any(Session.class));
    }

    @Test
    void requestSession_ShouldThrowConflict_WhenTimeConflict() {
        // Arrange
        when(sessionRepository.findSessionsInTimeRange(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(java.util.List.of(session));

        // Act & Assert
        assertThrows(SessionConflictException.class, () -> sessionService.requestSession(200L, requestDto));
    }

    @Test
    void acceptSession_ShouldSuccess_WhenRequested() {
        // Arrange
        when(sessionRepository.findById(anyLong())).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        // Act
        SessionResponseDto response = sessionService.acceptSession(1L);

        // Assert
        assertEquals("ACCEPTED", response.getStatus());
        verify(sessionRepository, times(1)).save(session);
    }

    @Test
    void acceptSession_ShouldThrowConflict_WhenNotRequested() {
        // Arrange
        session.setStatus(SessionStatus.ACCEPTED);
        when(sessionRepository.findById(anyLong())).thenReturn(Optional.of(session));

        // Act & Assert
        assertThrows(SessionConflictException.class, () -> sessionService.acceptSession(1L));
    }

    @Test
    void rejectSession_ShouldSuccess() {
        // Arrange
        when(sessionRepository.findById(anyLong())).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        // Act
        SessionResponseDto response = sessionService.rejectSession(1L, "Busy");

        // Assert
        assertEquals("REJECTED", response.getStatus());
        assertEquals("Busy", response.getRejectionReason());
    }

    @Test
    void cancelSession_ShouldSuccess() {
        // Arrange
        when(sessionRepository.findById(anyLong())).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        // Act
        SessionResponseDto response = sessionService.cancelSession(1L);

        // Assert
        assertEquals("CANCELLED", response.getStatus());
    }
}

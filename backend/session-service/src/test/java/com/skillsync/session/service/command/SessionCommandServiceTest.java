package com.skillsync.session.service.command;

import com.skillsync.session.client.UserClient;
import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.entity.Session;
import com.skillsync.session.entity.SessionStatus;
import com.skillsync.session.exception.SessionConflictException;
import com.skillsync.session.exception.SessionNotFoundException;
import com.skillsync.session.mapper.SessionMapper;
import com.skillsync.session.publisher.SessionEventPublisher;
import com.skillsync.session.repository.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionCommandServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private SessionEventPublisher eventPublisher;
    @Mock private SessionMapper sessionMapper;
    @Mock private UserClient userClient;

    @InjectMocks private SessionCommandService sessionCommandService;

    private Session session;
    private RequestSessionRequestDto requestDto;

    @BeforeEach
    void setUp() {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        session = new Session();
        session.setId(1L);
        session.setMentorId(100L);
        session.setLearnerId(200L);
        session.setStatus(SessionStatus.REQUESTED);
        session.setScheduledAt(tomorrow);
        session.setDurationMinutes(60);

        requestDto = new RequestSessionRequestDto();
        requestDto.setMentorId(100L);
        requestDto.setScheduledAt(tomorrow);
        requestDto.setDurationMinutes(60);
    }

    @Test
    void requestSession_ShouldSucceed_WhenNoConflict() {
        when(userClient.getUserProfile(anyLong())).thenReturn(null); // Simple bypass for test
        when(sessionRepository.findSessionsInTimeRange(anyLong(), any(), any())).thenReturn(List.of());
        when(sessionMapper.toEntity(eq(200L), any())).thenReturn(session);
        when(sessionRepository.save(any())).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(new SessionResponseDto());

        SessionResponseDto response = sessionCommandService.requestSession(200L, requestDto);

        assertNotNull(response);
        verify(sessionRepository).save(any());
        verify(eventPublisher).publishSessionRequested(any());
    }

    @Test
    void acceptSession_ShouldSuccess() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(new SessionResponseDto());

        sessionCommandService.acceptSession(1L);

        assertEquals(SessionStatus.ACCEPTED, session.getStatus());
        verify(eventPublisher).publishSessionAccepted(any());
    }

    @Test
    void acceptSession_ShouldThrow_WhenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(SessionNotFoundException.class, () -> sessionCommandService.acceptSession(99L));
    }

    @Test
    void cancelSession_ShouldSuccess() {
        session.setStatus(SessionStatus.ACCEPTED);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(new SessionResponseDto());

        sessionCommandService.cancelSession(1L);

        assertEquals(SessionStatus.CANCELLED, session.getStatus());
        verify(eventPublisher).publishSessionCancelled(any());
    }
}

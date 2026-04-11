package com.skillsync.session.service.impl;

import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.PageResponse;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.service.command.SessionCommandService;
import com.skillsync.session.service.query.SessionQueryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceImplTest {

    @Mock private SessionCommandService sessionCommandService;
    @Mock private SessionQueryService sessionQueryService;

    @InjectMocks private SessionServiceImpl sessionService;

    @Test
    void requestSession_shouldDelegate() {
        when(sessionCommandService.requestSession(anyLong(), any())).thenReturn(new SessionResponseDto());
        sessionService.requestSession(1L, new RequestSessionRequestDto());
        verify(sessionCommandService).requestSession(eq(1L), any());
    }

    @Test
    void acceptSession_shouldDelegate() {
        when(sessionCommandService.acceptSession(anyLong())).thenReturn(new SessionResponseDto());
        sessionService.acceptSession(1L);
        verify(sessionCommandService).acceptSession(1L);
    }

    @Test
    void rejectSession_shouldDelegate() {
        when(sessionCommandService.rejectSession(anyLong(), anyString())).thenReturn(new SessionResponseDto());
        sessionService.rejectSession(1L, "reason");
        verify(sessionCommandService).rejectSession(1L, "reason");
    }

    @Test
    void cancelSession_shouldDelegate() {
        when(sessionCommandService.cancelSession(anyLong())).thenReturn(new SessionResponseDto());
        sessionService.cancelSession(1L);
        verify(sessionCommandService).cancelSession(1L);
    }

    @Test
    void updateStatus_shouldDelegate() {
        doNothing().when(sessionCommandService).updateStatus(anyLong(), anyString());
        sessionService.updateStatus(1L, "COMPLETED");
        verify(sessionCommandService).updateStatus(1L, "COMPLETED");
    }

    @Test
    void getSession_shouldDelegate() {
        when(sessionQueryService.getSession(anyLong())).thenReturn(new SessionResponseDto());
        sessionService.getSession(1L);
        verify(sessionQueryService).getSession(1L);
    }

    @Test
    void getSessionsForMentor_shouldDelegate() {
        when(sessionQueryService.getSessionsForMentor(anyLong(), anyInt(), anyInt())).thenReturn(PageResponse.<SessionResponseDto>builder().build());
        sessionService.getSessionsForMentor(1L, 0, 10);
        verify(sessionQueryService).getSessionsForMentor(1L, 0, 10);
    }

    @Test
    void getSessionsForLearner_shouldDelegate() {
        when(sessionQueryService.getSessionsForLearner(anyLong(), anyInt(), anyInt())).thenReturn(PageResponse.<SessionResponseDto>builder().build());
        sessionService.getSessionsForLearner(1L, 0, 10);
        verify(sessionQueryService).getSessionsForLearner(1L, 0, 10);
    }

    @Test
    void getPendingSessions_shouldDelegate() {
        when(sessionQueryService.getPendingSessions()).thenReturn(List.of());
        sessionService.getPendingSessions();
        verify(sessionQueryService).getPendingSessions();
    }
}

package com.skillsync.session.service.query;

import com.skillsync.session.dto.response.PageResponse;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.entity.Session;
import com.skillsync.session.exception.SessionNotFoundException;
import com.skillsync.session.mapper.SessionMapper;
import com.skillsync.session.repository.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionQueryServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private SessionMapper sessionMapper;

    @InjectMocks private SessionQueryService sessionQueryService;

    private Session session;

    @BeforeEach
    void setUp() {
        session = new Session();
        session.setId(1L);
    }

    @Test
    void getSession_ShouldReturnDto_WhenExists() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionMapper.toDto(session)).thenReturn(new SessionResponseDto());

        SessionResponseDto result = sessionQueryService.getSession(1L);
        assertNotNull(result);
    }

    @Test
    void getSession_ShouldThrow_WhenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(SessionNotFoundException.class, () -> sessionQueryService.getSession(99L));
    }

    @Test
    void getSessionsForMentor_ShouldReturnPage() {
        Page<Session> page = new PageImpl<>(List.of(session));
        when(sessionRepository.findByMentorId(eq(100L), any())).thenReturn(page);
        when(sessionMapper.toDto(any())).thenReturn(new SessionResponseDto());

        PageResponse<SessionResponseDto> response = sessionQueryService.getSessionsForMentor(100L, 0, 10);
        
        assertNotNull(response);
        assertEquals(1, response.getContent().size());
    }
}

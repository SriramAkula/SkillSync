package com.skillsync.session.service.query;

import com.skillsync.session.dto.response.PageResponse;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.entity.Session;
import com.skillsync.session.entity.SessionStatus;
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
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionQueryServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private SessionMapper sessionMapper;

    @InjectMocks private SessionQueryService sessionQueryService;

    private Session session;
    private SessionResponseDto sessionDto;

    @BeforeEach
    void setUp() {
        session = new Session();
        session.setId(1L);
        session.setMentorId(100L);
        session.setLearnerId(200L);
        session.setScheduledAt(LocalDateTime.now().plusDays(1));
        session.setStatus(SessionStatus.REQUESTED);

        sessionDto = new SessionResponseDto();
        sessionDto.setId(1L);
    }

    @Test
    void getSession_shouldReturnDto_whenExists() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        SessionResponseDto result = sessionQueryService.getSession(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getSession_shouldThrow_whenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> sessionQueryService.getSession(99L))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void getSessionsForMentor_shouldReturnPaginatedResponse() {
        Page<Session> page = new PageImpl<>(List.of(session));
        when(sessionRepository.findByMentorId(anyLong(), any(Pageable.class))).thenReturn(page);
        when(sessionMapper.toDto(any())).thenReturn(sessionDto);

        PageResponse<SessionResponseDto> result = sessionQueryService.getSessionsForMentor(100L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void getSessionsForLearner_shouldReturnPaginatedResponse() {
        Page<Session> page = new PageImpl<>(List.of(session));
        when(sessionRepository.findByLearnerId(anyLong(), any(Pageable.class))).thenReturn(page);
        when(sessionMapper.toDto(any())).thenReturn(sessionDto);

        PageResponse<SessionResponseDto> result = sessionQueryService.getSessionsForLearner(200L, 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getPendingSessions_shouldReturnList() {
        when(sessionRepository.findPendingSessions()).thenReturn(List.of(session));
        when(sessionMapper.toDto(any())).thenReturn(sessionDto);

        List<SessionResponseDto> result = sessionQueryService.getPendingSessions();

        assertThat(result).hasSize(1);
    }
}

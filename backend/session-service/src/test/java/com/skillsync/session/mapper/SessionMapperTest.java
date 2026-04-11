package com.skillsync.session.mapper;

import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.entity.Session;
import com.skillsync.session.entity.SessionStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class SessionMapperTest {

    private final SessionMapper sessionMapper = new SessionMapper();

    @Test
    void toEntity_shouldMapCorrectly() {
        RequestSessionRequestDto request = new RequestSessionRequestDto();
        request.setMentorId(100L);
        request.setSkillId(10L);
        request.setScheduledAt(LocalDateTime.now().plusDays(1));
        request.setDurationMinutes(60);

        Session result = sessionMapper.toEntity(200L, request);

        assertThat(result.getLearnerId()).isEqualTo(200L);
        assertThat(result.getMentorId()).isEqualTo(100L);
        assertThat(result.getDurationMinutes()).isEqualTo(60);
        assertThat(result.getStatus()).isEqualTo(SessionStatus.REQUESTED);
    }

    @Test
    void toDto_shouldMapAllFields() {
        Session session = new Session();
        session.setId(1L);
        session.setMentorId(100L);
        session.setLearnerId(200L);
        session.setStatus(SessionStatus.ACCEPTED);
        session.setScheduledAt(LocalDateTime.now());

        SessionResponseDto result = sessionMapper.toDto(session);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getMentorId()).isEqualTo(100L);
        assertThat(result.getStatus()).isEqualTo("ACCEPTED");
    }
}

package com.skillsync.session.mapper;

import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.entity.Session;
import com.skillsync.session.entity.SessionStatus;
import org.springframework.stereotype.Component;

@Component
public class SessionMapper {

    // RequestSessionRequestDto + learnerId -> Session entity
    public Session toEntity(Long learnerId, RequestSessionRequestDto request) {
        Session session = new Session();
        session.setLearnerId(learnerId);
        session.setMentorId(request.getMentorId());
        session.setSkillId(request.getSkillId());
        session.setScheduledAt(request.getScheduledAt());
        session.setDurationMinutes(request.getDurationMinutes());
        session.setStatus(SessionStatus.REQUESTED);
        return session;
    }

    // Session entity -> SessionResponseDto
    public SessionResponseDto toDto(Session session) {
        return new SessionResponseDto(
                session.getId(),
                session.getMentorId(),
                session.getLearnerId(),
                session.getSkillId(),
                session.getScheduledAt(),
                session.getDurationMinutes(),
                session.getStatus().getValue(),
                session.getRejectionReason(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}

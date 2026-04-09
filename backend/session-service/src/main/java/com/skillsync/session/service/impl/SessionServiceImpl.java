package com.skillsync.session.service.impl;

import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.service.SessionService;
import com.skillsync.session.service.command.SessionCommandService;
import com.skillsync.session.service.query.SessionQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionCommandService sessionCommandService;
    private final SessionQueryService sessionQueryService;

    @Override
    public SessionResponseDto requestSession(Long learnerId, RequestSessionRequestDto request) {
        return sessionCommandService.requestSession(learnerId, request);
    }

    @Override
    public SessionResponseDto acceptSession(Long sessionId) {
        return sessionCommandService.acceptSession(sessionId);
    }

    @Override
    public SessionResponseDto rejectSession(Long sessionId, String reason) {
        return sessionCommandService.rejectSession(sessionId, reason);
    }

    @Override
    public SessionResponseDto cancelSession(Long sessionId) {
        return sessionCommandService.cancelSession(sessionId);
    }

    @Override
    public void updateStatus(Long sessionId, String status) {
        sessionCommandService.updateStatus(sessionId, status);
    }

    @Override
    public SessionResponseDto getSession(Long sessionId) {
        return sessionQueryService.getSession(sessionId);
    }

    @Override
    public List<SessionResponseDto> getSessionsForMentor(Long mentorId) {
        return sessionQueryService.getSessionsForMentor(mentorId);
    }

    @Override
    public List<SessionResponseDto> getSessionsForLearner(Long learnerId) {
        return sessionQueryService.getSessionsForLearner(learnerId);
    }

    @Override
    public List<SessionResponseDto> getPendingSessions() {
        return sessionQueryService.getPendingSessions();
    }
}

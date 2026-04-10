package com.skillsync.session.service;

import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.PageResponse;
import com.skillsync.session.dto.response.SessionResponseDto;
import java.util.List;

public interface SessionService {
    SessionResponseDto requestSession(Long learnerId, RequestSessionRequestDto request);
    SessionResponseDto getSession(Long sessionId);
    PageResponse<SessionResponseDto> getSessionsForMentor(Long mentorId, int page, int size);
    PageResponse<SessionResponseDto> getSessionsForLearner(Long learnerId, int page, int size);
    SessionResponseDto acceptSession(Long sessionId);
    SessionResponseDto rejectSession(Long sessionId, String reason);
    SessionResponseDto cancelSession(Long sessionId);
    List<SessionResponseDto> getPendingSessions();
    void updateStatus(Long sessionId, String status);
}

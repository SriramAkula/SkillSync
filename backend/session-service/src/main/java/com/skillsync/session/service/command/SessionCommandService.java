package com.skillsync.session.service.command;

import com.skillsync.session.client.UserClient;
import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.entity.Session;
import com.skillsync.session.entity.SessionStatus;
import com.skillsync.session.event.SessionAcceptedEvent;
import com.skillsync.session.event.SessionCancelledEvent;
import com.skillsync.session.event.SessionRejectedEvent;
import com.skillsync.session.event.SessionRequestedEvent;
import com.skillsync.session.exception.SessionConflictException;
import com.skillsync.session.exception.SessionNotFoundException;
import com.skillsync.session.mapper.SessionMapper;
import com.skillsync.session.publisher.SessionEventPublisher;
import com.skillsync.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionCommandService {

    private final SessionRepository sessionRepository;
    private final SessionEventPublisher eventPublisher;
    private final SessionMapper sessionMapper;
    private final UserClient userClient;

    @Transactional
    @CacheEvict(value = "session", allEntries = true)
    public SessionResponseDto requestSession(Long learnerId, RequestSessionRequestDto request) {
        log.info("Requesting session: learnerId={}, mentorId={}, skillId={}, scheduledAt={}",
                learnerId, request.getMentorId(), request.getSkillId(), request.getScheduledAt());
        try {
            com.skillsync.session.dto.ApiResponse<com.skillsync.session.dto.response.UserProfileResponseDto> userResponse =
                    userClient.getUserProfile(learnerId);
            if (userResponse != null && userResponse.getData() != null
                    && Boolean.TRUE.equals(userResponse.getData().getIsBlocked())) {
                log.warn("Blocked user {} attempted to book a session", learnerId);
                throw new SessionConflictException("Your account is blocked. You cannot book sessions.");
            }
        } catch (SessionConflictException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not verify blocked status for user {}: {}. Proceeding with caution.", learnerId, e.getMessage());
        }

        List<Session> conflicts = sessionRepository.findSessionsInTimeRange(
                request.getMentorId(),
                request.getScheduledAt().minusMinutes(request.getDurationMinutes()),
                request.getScheduledAt().plusMinutes(request.getDurationMinutes()));
        if (!conflicts.isEmpty()) {
            throw new SessionConflictException("Mentor has a conflicting session at this time.");
        }

        Session saved = sessionRepository.save(sessionMapper.toEntity(learnerId, request));
        eventPublisher.publishSessionRequested(new SessionRequestedEvent(
                saved.getId(), saved.getMentorId(), saved.getLearnerId(),
                saved.getScheduledAt(), saved.getDurationMinutes()));
        return sessionMapper.toDto(saved);
    }

    @Transactional
    @CacheEvict(value = "session", allEntries = true)
    public SessionResponseDto acceptSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found"));
        if (!SessionStatus.REQUESTED.equals(session.getStatus())) {
            throw new SessionConflictException("Session is already " + session.getStatus());
        }
        session.setStatus(SessionStatus.ACCEPTED);
        Session saved = sessionRepository.save(session);
        eventPublisher.publishSessionAccepted(new SessionAcceptedEvent(
                saved.getId(), saved.getMentorId(), saved.getLearnerId()));
        return sessionMapper.toDto(saved);
    }

    @Transactional
    @CacheEvict(value = "session", allEntries = true)
    public SessionResponseDto rejectSession(Long sessionId, String reason) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found"));
        if (!SessionStatus.REQUESTED.equals(session.getStatus())) {
            throw new SessionConflictException("Only REQUESTED sessions can be rejected. Current status: " + session.getStatus());
        }
        session.setStatus(SessionStatus.REJECTED);
        session.setRejectionReason(reason);
        Session saved = sessionRepository.save(session);
        eventPublisher.publishSessionRejected(new SessionRejectedEvent(
                saved.getId(), saved.getMentorId(), saved.getLearnerId(), reason));
        return sessionMapper.toDto(saved);
    }

    @Transactional
    @CacheEvict(value = "session", allEntries = true)
    public SessionResponseDto cancelSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found"));
        if (!SessionStatus.ACCEPTED.equals(session.getStatus()) && !SessionStatus.REQUESTED.equals(session.getStatus())) {
            throw new SessionConflictException("Only REQUESTED or ACCEPTED sessions can be cancelled. Current status: " + session.getStatus());
        }
        session.setStatus(SessionStatus.CANCELLED);
        Session saved = sessionRepository.save(session);
        eventPublisher.publishSessionCancelled(new SessionCancelledEvent(
                saved.getId(), saved.getMentorId(), saved.getLearnerId()));
        return sessionMapper.toDto(saved);
    }

    @Transactional
    @CacheEvict(value = "session", allEntries = true)
    public void updateStatus(Long sessionId, String status) {
        log.info("Updating session {} status to {} (called by payment-gateway)", sessionId, status);
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found with ID: " + sessionId));
        session.setStatus(SessionStatus.valueOf(status));
        sessionRepository.save(session);
    }
}

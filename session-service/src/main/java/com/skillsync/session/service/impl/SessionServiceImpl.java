package com.skillsync.session.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.entity.Session;
import com.skillsync.session.entity.SessionStatus;
import com.skillsync.session.event.SessionRequestedEvent;
import com.skillsync.session.event.SessionAcceptedEvent;
import com.skillsync.session.event.SessionRejectedEvent;
import com.skillsync.session.event.SessionCancelledEvent;
import com.skillsync.session.exception.SessionConflictException;
import com.skillsync.session.exception.SessionNotFoundException;
import com.skillsync.session.publisher.SessionEventPublisher;
import com.skillsync.session.repository.SessionRepository;
import com.skillsync.session.service.SessionService;

import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

@Service
@CacheConfig(cacheNames = "session")
public class SessionServiceImpl implements SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionServiceImpl.class);
    
    @Autowired
    private SessionRepository sessionRepository;
    
    @Autowired
    private SessionEventPublisher eventPublisher;

    @Override
    @Transactional
    public SessionResponseDto requestSession(Long learnerId, RequestSessionRequestDto request) {
        log.info("Requesting session: learnerId={}, mentorId={}, skillId={}, scheduledAt={}", 
            learnerId, request.getMentorId(), request.getSkillId(), request.getScheduledAt());

        // Check for time conflicts using findSessionsInTimeRange
        List<Session> conflictingSessions = sessionRepository.findSessionsInTimeRange(
                request.getMentorId(),
                request.getScheduledAt().minusMinutes(request.getDurationMinutes()),
                request.getScheduledAt().plusMinutes(request.getDurationMinutes())
        );

        if (!conflictingSessions.isEmpty()) {
            throw new SessionConflictException("Mentor has a conflicting session at this time.");
        }

        Session session = new Session();
        session.setLearnerId(learnerId);
        session.setMentorId(request.getMentorId());
        session.setSkillId(request.getSkillId());
        session.setScheduledAt(request.getScheduledAt());
        session.setDurationMinutes(request.getDurationMinutes());
        session.setStatus(SessionStatus.REQUESTED);

        Session savedSession = sessionRepository.save(session);
        
        // Publish SessionRequestedEvent with resilience (CircuitBreaker + Retry)
        SessionRequestedEvent event = new SessionRequestedEvent(
            savedSession.getId(),
            savedSession.getMentorId(),
            savedSession.getLearnerId(),
            savedSession.getScheduledAt(),
            savedSession.getDurationMinutes()
        );
        eventPublisher.publishSessionRequested(event);
        
        return mapToResponseDto(savedSession);
    }

    @Override
    @Cacheable(key = "#sessionId")
    public SessionResponseDto getSession(Long sessionId) {
        log.info("Cache MISS — fetching sessionId={} from DB", sessionId);
        return sessionRepository.findById(sessionId)
                .map(this::mapToResponseDto)
                .orElseThrow(() -> new SessionNotFoundException("Session not found with ID: " + sessionId));
    }

    @Override
    @Cacheable(key = "'mentor_' + #mentorId")
    public List<SessionResponseDto> getSessionsForMentor(Long mentorId) {
        log.info("Cache MISS — fetching sessions for mentorId={} from DB", mentorId);
        return sessionRepository.findByMentorId(mentorId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(key = "'learner_' + #learnerId")
    public List<SessionResponseDto> getSessionsForLearner(Long learnerId) {
        log.info("Cache MISS — fetching sessions for learnerId={} from DB", learnerId);
        return sessionRepository.findByLearnerId(learnerId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public SessionResponseDto acceptSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found"));
        
        if (!SessionStatus.REQUESTED.equals(session.getStatus())) {
            throw new SessionConflictException("Session is already " + session.getStatus());
        }

        session.setStatus(SessionStatus.ACCEPTED);
        Session savedSession = sessionRepository.save(session);
        
        // Publish SessionAcceptedEvent with resilience (CircuitBreaker + Retry)
        SessionAcceptedEvent event = new SessionAcceptedEvent(
            savedSession.getId(),
            savedSession.getMentorId(),
            savedSession.getLearnerId()
        );
        eventPublisher.publishSessionAccepted(event);
        
        return mapToResponseDto(savedSession);
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public SessionResponseDto rejectSession(Long sessionId, String reason) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found"));
        
        if (!SessionStatus.REQUESTED.equals(session.getStatus())) {
            throw new SessionConflictException("Only REQUESTED sessions can be rejected. Current status: " + session.getStatus());
        }
        
        session.setStatus(SessionStatus.REJECTED);
        session.setRejectionReason(reason);
        Session savedSession = sessionRepository.save(session);
        
        // Publish SessionRejectedEvent with resilience (CircuitBreaker + Retry)
        SessionRejectedEvent event = new SessionRejectedEvent(
            savedSession.getId(),
            savedSession.getMentorId(),
            savedSession.getLearnerId(),
            reason
        );
        eventPublisher.publishSessionRejected(event);
        
        return mapToResponseDto(savedSession);
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public SessionResponseDto cancelSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found"));
        
        if (!SessionStatus.ACCEPTED.equals(session.getStatus())) {
            throw new SessionConflictException("Only ACCEPTED sessions can be cancelled. Current status: " + session.getStatus());
        }
        
        session.setStatus(SessionStatus.CANCELLED);
        Session savedSession = sessionRepository.save(session);
        
        // Publish SessionCancelledEvent with resilience (CircuitBreaker + Retry)
        SessionCancelledEvent event = new SessionCancelledEvent(
            savedSession.getId(),
            savedSession.getMentorId(),
            savedSession.getLearnerId()
        );
        eventPublisher.publishSessionCancelled(event);
        
        return mapToResponseDto(savedSession);
    }

    @Override
    public List<SessionResponseDto> getPendingSessions() {
        return sessionRepository.findPendingSessions().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public void updateStatus(Long sessionId, String status) {
        log.info("Updating session {} status to {} (called by payment-gateway)", sessionId, status);
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found with ID: " + sessionId));
        session.setStatus(SessionStatus.valueOf(status));
        sessionRepository.save(session);
    }

    private SessionResponseDto mapToResponseDto(Session session) {
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

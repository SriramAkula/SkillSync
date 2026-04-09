package com.skillsync.session.service.query;

import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.exception.SessionNotFoundException;
import com.skillsync.session.mapper.SessionMapper;
import com.skillsync.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionQueryService {

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;

    @Cacheable(value = "session", key = "#sessionId")
    public SessionResponseDto getSession(Long sessionId) {
        log.info("Cache MISS - fetching sessionId={} from DB", sessionId);
        return sessionRepository.findById(sessionId)
                .map(sessionMapper::toDto)
                .orElseThrow(() -> new SessionNotFoundException("Session not found with ID: " + sessionId));
    }

    @Cacheable(value = "session", key = "'mentor_' + #mentorId")
    public List<SessionResponseDto> getSessionsForMentor(Long mentorId) {
        log.info("Cache MISS - fetching sessions for mentorId={} from DB", mentorId);
        return sessionRepository.findByMentorId(mentorId).stream()
                .map(sessionMapper::toDto).collect(Collectors.toList());
    }

    @Cacheable(value = "session", key = "'learner_' + #learnerId")
    public List<SessionResponseDto> getSessionsForLearner(Long learnerId) {
        log.info("Cache MISS - fetching sessions for learnerId={} from DB", learnerId);
        return sessionRepository.findByLearnerId(learnerId).stream()
                .map(sessionMapper::toDto).collect(Collectors.toList());
    }

    public List<SessionResponseDto> getPendingSessions() {
        return sessionRepository.findPendingSessions().stream()
                .map(sessionMapper::toDto).collect(Collectors.toList());
    }
}

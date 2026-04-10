package com.skillsync.session.service.query;

import com.skillsync.session.dto.response.PageResponse;
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
                .orElseThrow(() -> new com.skillsync.session.exception.SessionNotFoundException("Session not found with ID: " + sessionId));
    }

    public com.skillsync.session.dto.response.PageResponse<SessionResponseDto> getSessionsForMentor(Long mentorId, int page, int size) {
        log.info("Fetching paginated sessions for mentorId={}, page={}, size={}", mentorId, page, size);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("scheduledAt").descending());
        org.springframework.data.domain.Page<com.skillsync.session.entity.Session> sessionPage = sessionRepository.findByMentorId(mentorId, pageable);
        
        return com.skillsync.session.dto.response.PageResponse.<SessionResponseDto>builder()
                .content(sessionPage.getContent().stream().map(sessionMapper::toDto).collect(java.util.stream.Collectors.toList()))
                .currentPage(sessionPage.getNumber())
                .totalElements(sessionPage.getTotalElements())
                .totalPages(sessionPage.getTotalPages())
                .pageSize(sessionPage.getSize())
                .build();
    }

    public com.skillsync.session.dto.response.PageResponse<SessionResponseDto> getSessionsForLearner(Long learnerId, int page, int size) {
        log.info("Fetching paginated sessions for learnerId={}, page={}, size={}", learnerId, page, size);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("scheduledAt").descending());
        org.springframework.data.domain.Page<com.skillsync.session.entity.Session> sessionPage = sessionRepository.findByLearnerId(learnerId, pageable);
        
        return com.skillsync.session.dto.response.PageResponse.<SessionResponseDto>builder()
                .content(sessionPage.getContent().stream().map(sessionMapper::toDto).collect(java.util.stream.Collectors.toList()))
                .currentPage(sessionPage.getNumber())
                .totalElements(sessionPage.getTotalElements())
                .totalPages(sessionPage.getTotalPages())
                .pageSize(sessionPage.getSize())
                .build();
    }

    public List<SessionResponseDto> getPendingSessions() {
        return sessionRepository.findPendingSessions().stream()
                .map(sessionMapper::toDto).collect(Collectors.toList());
    }
}

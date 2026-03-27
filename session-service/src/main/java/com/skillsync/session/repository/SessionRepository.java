package com.skillsync.session.repository;

import com.skillsync.session.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    
    Optional<Session> findById(Long id);
    
    @Query("SELECT s FROM Session s WHERE s.mentorId = :mentorId " +
           "AND s.scheduledAt = :scheduledAt " +
           "AND s.status IN ('REQUESTED', 'ACCEPTED')")
    Optional<Session> findConflictingSession(Long mentorId, LocalDateTime scheduledAt);
    
    @Query("SELECT s FROM Session s WHERE s.mentorId = :mentorId ORDER BY s.scheduledAt DESC")
    List<Session> findByMentorId(Long mentorId);
    
    @Query("SELECT s FROM Session s WHERE s.learnerId = :learnerId ORDER BY s.scheduledAt DESC")
    List<Session> findByLearnerId(Long learnerId);
    
    @Query("SELECT s FROM Session s WHERE s.status = 'REQUESTED' ORDER BY s.createdAt ASC")
    List<Session> findPendingSessions();
    
    @Query("SELECT s FROM Session s WHERE s.mentorId = :mentorId " +
           "AND s.scheduledAt >= :startTime AND s.scheduledAt <= :endTime " +
           "AND s.status IN ('REQUESTED', 'ACCEPTED')")
    List<Session> findSessionsInTimeRange(Long mentorId, LocalDateTime startTime, LocalDateTime endTime);
}

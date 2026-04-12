package com.skillsync.session.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import com.skillsync.session.audit.Auditable;

import lombok.*;

@Entity
@Table(name = "sessions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"mentor_id", "scheduled_at"}, 
                     name = "uk_mentor_scheduled_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long mentorId;
    
    @Column(nullable = false)
    private Long learnerId;
    
    @Column(nullable = false)
    private Long skillId;
    
    @Column(nullable = false)
    private LocalDateTime scheduledAt;
    
    @Column(nullable = false)
    private Integer durationMinutes;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.REQUESTED;
    
    @Column
    private String rejectionReason;

}


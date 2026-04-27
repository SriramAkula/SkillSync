package com.skillsync.skill.audit;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_entity", columnList = "entity_name, entity_id"),
        @Index(name = "idx_audit_user", columnList = "performed_by")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_name", nullable = false, length = 100)
    private String entityName;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "performed_by", length = 50)
    private String performedBy;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() { this.timestamp = LocalDateTime.now(); }
}

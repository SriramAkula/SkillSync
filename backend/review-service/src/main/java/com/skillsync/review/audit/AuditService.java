package com.skillsync.review.audit;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(String entityName, Long entityId, String action, String performedBy, String details) {
        try {
            AuditLog entry = new AuditLog();
            entry.setEntityName(entityName);
            entry.setEntityId(entityId);
            entry.setAction(action);
            entry.setPerformedBy(performedBy != null ? performedBy : "system");
            entry.setDetails(details);
            auditLogRepository.save(entry);
            log.debug("[AUDIT] {} {} id={} by={}", action, entityName, entityId, performedBy);
        } catch (Exception e) {
            log.warn("[AUDIT] Failed to save audit log: {}", e.getMessage());
        }
    }
}

package com.skillsync.user.audit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock private AuditLogRepository auditLogRepository;
    @InjectMocks private AuditService auditService;

    @Test
    void log_shouldSaveEntry() {
        auditService.log("User", 1L, "UPDATE", "admin", "details");
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void log_shouldHandleRepositoryFailure() {
        when(auditLogRepository.save(any())).thenThrow(new RuntimeException("DB error"));
        // Should not throw
        auditService.log("User", 1L, "UPDATE", "admin", "details");
        verify(auditLogRepository).save(any());
    }

    @Test
    void log_shouldUseSystem_whenPerformedByNull() {
        auditService.log("User", 1L, "UPDATE", null, "details");
        verify(auditLogRepository).save(argThat(log -> "system".equals(log.getPerformedBy())));
    }
}

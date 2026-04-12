package com.skillsync.session.audit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock private AuditLogRepository auditLogRepository;
    @InjectMocks private AuditService auditService;

    @Test
    void log_shouldSaveEntry() {
        auditService.log("Session", 1L, "CANCEL", "user1", "Cancellation reason");
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void log_shouldUseSystem_whenPerformedByNull() {
        auditService.log("Session", 1L, "STUTUS_CHANGE", null, "System auto update");
        verify(auditLogRepository).save(argThat(entry -> "system".equals(entry.getPerformedBy())));
    }

    @Test
    void log_shouldHandleException() {
        when(auditLogRepository.save(any())).thenThrow(new RuntimeException("DB down"));
        // Should not throw exception upstream
        auditService.log("Session", 1L, "CREATE", "user", "details");
        verify(auditLogRepository).save(any());
    }
}

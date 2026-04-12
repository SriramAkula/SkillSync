package com.skillsync.payment.audit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditService auditService;

    @Test
    void log_shouldSaveEntry_whenPerformedByProvided() {
        auditService.log("Order", 1L, "CREATE", "user1", "details");
        verify(auditLogRepository).save(argThat(log -> "user1".equals(log.getPerformedBy())));
    }

    @Test
    void log_shouldSaveEntryWithSystem_whenPerformedByNull() {
        auditService.log("Order", 1L, "CREATE", null, "details");
        verify(auditLogRepository).save(argThat(log -> "system".equals(log.getPerformedBy())));
    }

    @Test
    void log_shouldCatchException_whenSaveFails() {
        doThrow(new RuntimeException("DB error")).when(auditLogRepository).save(any());
        // Should not throw exception
        auditService.log("Order", 1L, "CREATE", "user1", "details");
        verify(auditLogRepository).save(any());
    }
}

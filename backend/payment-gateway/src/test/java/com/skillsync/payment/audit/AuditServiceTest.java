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
    void log_shouldSaveAuditLog() {
        auditService.log("Payment", 1L, "CREATE", "user1", "details");
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void log_shouldHandleException_whenRepositoryFails() {
        when(auditLogRepository.save(any())).thenThrow(new RuntimeException("DB error"));
        
        // Should not throw exception
        auditService.log("Payment", 1L, "CREATE", "user1", "details");
        
        verify(auditLogRepository).save(any());
    }
}

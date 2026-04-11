package com.skillsync.review.audit;

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
        auditService.log("Review", 1L, "DELETE", "user1", "details");
        verify(auditLogRepository).save(any(AuditLog.class));
    }
}

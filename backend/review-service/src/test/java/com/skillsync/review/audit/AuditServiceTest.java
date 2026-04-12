package com.skillsync.review.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
    void log_shouldSaveAuditLog_whenExplicitPerformedByIsGiven() {
        auditService.log("Review", 1L, "CREATE", "user123", "Details");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getEntityName()).isEqualTo("Review");
        assertThat(saved.getEntityId()).isEqualTo(1L);
        assertThat(saved.getAction()).isEqualTo("CREATE");
        assertThat(saved.getPerformedBy()).isEqualTo("user123");
        assertThat(saved.getDetails()).isEqualTo("Details");
    }

    @Test
    void log_shouldSaveSystemAsPerformedBy_whenNullIsGiven() {
        auditService.log("Review", 1L, "CREATE", null, "Details");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getPerformedBy()).isEqualTo("system");
    }

    @Test
    void log_shouldNotPropagateException_whenRepositoryThrows() {
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("DB offline"));

        auditService.log("Review", 1L, "CREATE", "user123", "Details");
        
        verify(auditLogRepository).save(any(AuditLog.class));
    }
}

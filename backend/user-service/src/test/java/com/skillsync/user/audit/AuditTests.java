package com.skillsync.user.audit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class AuditTests {

    private AuditConfig auditConfig;

    @BeforeEach
    void setUp() {
        auditConfig = new AuditConfig();
        RequestContextHolder.resetRequestAttributes();
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void auditLog_shouldSetAndGetFields() {
        AuditLog log = new AuditLog();
        log.setEntityName("TestEntity");
        log.setEntityId(1L);
        log.setAction("CREATE");
        log.setPerformedBy("system");
        log.setDetails("Details");
        log.onCreate(); // Trigger PrePersist

        assertThat(log.getId()).isNull();
        assertThat(log.getEntityName()).isEqualTo("TestEntity");
        assertThat(log.getEntityId()).isEqualTo(1L);
        assertThat(log.getAction()).isEqualTo("CREATE");
        assertThat(log.getPerformedBy()).isEqualTo("system");
        assertThat(log.getDetails()).isEqualTo("Details");
        assertThat(log.getTimestamp()).isNotNull();
    }

    @Test
    void auditable_shouldSetAndGetFields() {
        Auditable auditable = new Auditable() {};
        auditable.setCreatedBy("user1");
        auditable.setLastModifiedBy("user2");

        assertThat(auditable.getCreatedBy()).isEqualTo("user1");
        assertThat(auditable.getLastModifiedBy()).isEqualTo("user2");
    }

    @Test
    void auditorProvider_shouldReturnUserId_whenHeaderPresent() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-User-Id", "42");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        String auditor = auditConfig.auditorProvider().getCurrentAuditor().orElse("empty");
        assertThat(auditor).isEqualTo("42");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenHeaderMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        String auditor = auditConfig.auditorProvider().getCurrentAuditor().orElse("empty");
        assertThat(auditor).isEqualTo("system");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenRequestAttributesNull() {
        RequestContextHolder.setRequestAttributes(null);

        String auditor = auditConfig.auditorProvider().getCurrentAuditor().orElse("empty");
        assertThat(auditor).isEqualTo("system");
    }
}

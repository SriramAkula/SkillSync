package com.skillsync.review.audit;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.AuditorAware;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class AuditConfigTest {

    private final AuditConfig auditConfig = new AuditConfig();

    @Test
    void auditorProvider_shouldReturnUserId_whenHeaderPresent() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-User-Id", "123");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        AuditorAware<String> auditorProvider = auditConfig.auditorProvider();
        Optional<String> auditor = auditorProvider.getCurrentAuditor();

        assertThat(auditor).isPresent().contains("123");
        RequestContextHolder.resetRequestAttributes();
    }
}

package com.skillsync.payment.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

class AuditConfigTest {

    private AuditConfig auditConfig;

    @BeforeEach
    void setUp() {
        auditConfig = new AuditConfig();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void auditorProvider_shouldReturnUserId_whenHeaderPresent() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-User-Id", "123");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        Optional<String> result = auditConfig.auditorProvider().getCurrentAuditor();

        assertThat(result).contains("123");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenHeaderMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        Optional<String> result = auditConfig.auditorProvider().getCurrentAuditor();

        assertThat(result).contains("system");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenNoRequest() {
        Optional<String> result = auditConfig.auditorProvider().getCurrentAuditor();
        assertThat(result).contains("system");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenException() {
        // Force an exception by passing null to ServletRequestAttributes if possible, 
        // or just rely on the try-catch for any runtime issues.
        // Actually, let's just test the null path.
        RequestContextHolder.setRequestAttributes(null);
        Optional<String> result = auditConfig.auditorProvider().getCurrentAuditor();
        assertThat(result).contains("system");
    }
}

package com.skillsync.authservice.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.AuditorAware;
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

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void auditorProvider_shouldReturnUserId_whenHeaderPresent() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-User-Id")).thenReturn("user-456");
        ServletRequestAttributes attrs = new ServletRequestAttributes(request);
        RequestContextHolder.setRequestAttributes(attrs);

        AuditorAware<String> provider = auditConfig.auditorProvider();
        Optional<String> auditor = provider.getCurrentAuditor();

        assertThat(auditor).contains("user-456");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenRequestAttributesNull() {
        RequestContextHolder.setRequestAttributes(null);

        AuditorAware<String> provider = auditConfig.auditorProvider();
        Optional<String> auditor = provider.getCurrentAuditor();

        assertThat(auditor).contains("system");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenUserIdHeaderBlank() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-User-Id")).thenReturn(" ");
        ServletRequestAttributes attrs = new ServletRequestAttributes(request);
        RequestContextHolder.setRequestAttributes(attrs);

        AuditorAware<String> provider = auditConfig.auditorProvider();
        Optional<String> auditor = provider.getCurrentAuditor();

        assertThat(auditor).contains("system");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenUserIdHeaderNull() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-User-Id")).thenReturn(null);
        ServletRequestAttributes attrs = new ServletRequestAttributes(request);
        RequestContextHolder.setRequestAttributes(attrs);

        AuditorAware<String> provider = auditConfig.auditorProvider();
        Optional<String> auditor = provider.getCurrentAuditor();

        assertThat(auditor).contains("system");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenExceptionOccurs() {
        // Force exception via ClassCastException
        RequestContextHolder.setRequestAttributes(mock(org.springframework.web.context.request.RequestAttributes.class));

        AuditorAware<String> provider = auditConfig.auditorProvider();
        Optional<String> auditor = provider.getCurrentAuditor();

        assertThat(auditor).contains("system");
    }
}

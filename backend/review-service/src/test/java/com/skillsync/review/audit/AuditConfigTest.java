package com.skillsync.review.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class AuditConfigTest {

    private AuditConfig auditConfig;

    @BeforeEach
    void setUp() {
        auditConfig = new AuditConfig();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void auditorProvider_shouldReturnUserId_whenHeaderPresent() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-User-Id")).thenReturn("test-user");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        Optional<String> result = auditConfig.auditorProvider().getCurrentAuditor();

        assertThat(result).isPresent().contains("test-user");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenHeaderNull() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-User-Id")).thenReturn(null);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        Optional<String> result = auditConfig.auditorProvider().getCurrentAuditor();

        assertThat(result).isPresent().contains("system");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenHeaderBlank() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-User-Id")).thenReturn("   ");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        Optional<String> result = auditConfig.auditorProvider().getCurrentAuditor();

        assertThat(result).isPresent().contains("system");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenNoRequestAttributes() {
        Optional<String> result = auditConfig.auditorProvider().getCurrentAuditor();

        assertThat(result).isPresent().contains("system");
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenExceptionThrown() {
        // Set attributes to something that is NOT ServletRequestAttributes to cause ClassCastException
        org.springframework.web.context.request.RequestAttributes mockAttrs = mock(org.springframework.web.context.request.RequestAttributes.class);
        RequestContextHolder.setRequestAttributes(mockAttrs);
        
        Optional<String> result = auditConfig.auditorProvider().getCurrentAuditor();
        
        assertThat(result).isPresent().contains("system");
    }
}

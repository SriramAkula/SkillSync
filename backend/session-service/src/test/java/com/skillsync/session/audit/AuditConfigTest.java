package com.skillsync.session.audit;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.data.domain.AuditorAware;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class AuditConfigTest {

    @Test
    void auditorProvider_shouldReturnUserId_whenHeaderPresent() {
        AuditConfig config = new AuditConfig();
        AuditorAware<String> provider = config.auditorProvider();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-User-Id", "123");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        try {
            Optional<String> result = provider.getCurrentAuditor();
            assertThat(result).contains("123");
        } finally {
            RequestContextHolder.resetRequestAttributes();
        }
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenHeaderMissing() {
        AuditConfig config = new AuditConfig();
        AuditorAware<String> provider = config.auditorProvider();

        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        try {
            Optional<String> result = provider.getCurrentAuditor();
            assertThat(result).contains("system");
        } finally {
            RequestContextHolder.resetRequestAttributes();
        }
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenUserIdBlank() {
        AuditConfig config = new AuditConfig();
        AuditorAware<String> provider = config.auditorProvider();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-User-Id", "  ");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        try {
            Optional<String> result = provider.getCurrentAuditor();
            assertThat(result).contains("system");
        } finally {
            RequestContextHolder.resetRequestAttributes();
        }
    }

    @Test
    void auditorProvider_shouldReturnSystem_whenNoRequestAttributes() {
        AuditConfig config = new AuditConfig();
        AuditorAware<String> provider = config.auditorProvider();

        RequestContextHolder.resetRequestAttributes();
        Optional<String> result = provider.getCurrentAuditor();
        assertThat(result).contains("system");
    }
}

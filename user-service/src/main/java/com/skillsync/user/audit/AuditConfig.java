package com.skillsync.user.audit;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            try {
                ServletRequestAttributes attrs =
                        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attrs != null) {
                    String userId = attrs.getRequest().getHeader("X-User-Id");
                    if (userId != null && !userId.isBlank()) return Optional.of(userId);
                }
            } catch (Exception ignored) {}
            return Optional.of("system");
        };
    }
}

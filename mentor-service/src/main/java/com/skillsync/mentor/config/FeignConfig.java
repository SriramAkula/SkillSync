package com.skillsync.mentor.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Feign Client Configuration
 * Interceptor to add service-to-service authentication headers to all Feign requests
 */
@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                // Add service-to-service authentication headers
                // These headers allow internal service calls to bypass gateway checks
                template.header("X-Service-Auth", "true");
                template.header("X-Internal-Service", "mentor-service");
            }
        };
    }
}

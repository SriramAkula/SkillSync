package com.skillsync.authservice.config;

import feign.RequestInterceptor;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import feign.Response;
import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            // This ensures the internal call is trusted by the User Service
            requestTemplate.header("X-Gateway-Request", "true");
        };
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return (methodKey, response) -> {
            // Log the error but don't fail startup
            if (response.status() >= 500) {
                return new RuntimeException("Service temporarily unavailable: " + response.status());
            }
            return new RuntimeException("Feign error: " + response.status());
        };
    }
}
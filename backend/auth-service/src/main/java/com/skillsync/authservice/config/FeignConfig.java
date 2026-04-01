package com.skillsync.authservice.config;

import feign.RequestInterceptor;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    private static final String HEADER_GATEWAY_REQUEST = "X-Gateway-Request";
    private static final String GATEWAY_REQUEST_VALUE  = "true";
    private static final int    SERVER_ERROR_THRESHOLD = 500;

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate ->
            requestTemplate.header(HEADER_GATEWAY_REQUEST, GATEWAY_REQUEST_VALUE);
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return (methodKey, response) -> {
            if (response.status() >= SERVER_ERROR_THRESHOLD) {
                return new RuntimeException("Service temporarily unavailable: " + response.status());
            }
            return new RuntimeException("Feign error: " + response.status());
        };
    }
}

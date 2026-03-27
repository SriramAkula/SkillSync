package com.skillsync.payment.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    /**
     * Adds X-Gateway-Request: true to every outgoing Feign call.
     * Required because downstream services (mentor-service, session-service)
     * reject requests that don't come through the API Gateway.
     */
    @Bean
    public RequestInterceptor gatewayRequestInterceptor() {
        return requestTemplate -> requestTemplate.header("X-Gateway-Request", "true");
    }
}

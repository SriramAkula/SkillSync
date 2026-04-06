package com.skillsync.user.config;

import feign.RequestInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Feign Configuration for User Service
 * Automatically adds security and gateway headers to all outgoing microservice calls
 */
@Configuration
public class FeignConfig {

    private static final Logger log = LoggerFactory.getLogger(FeignConfig.class);
    
    private static final String HEADER_GATEWAY_REQUEST  = "X-Gateway-Request";
    private static final String HEADER_INTERNAL_SERVICE = "X-Internal-Service";
    private static final String HEADER_SERVICE_AUTH     = "X-Service-Auth";
    
    private static final String GATEWAY_REQUEST_VALUE  = "true";
    private static final String SERVICE_AUTH_VALUE     = "true";
    private static final String SERVICE_NAME           = "user-service";

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            log.debug("Injecting security headers into Feign request to: {}", requestTemplate.url());
            requestTemplate.header(HEADER_GATEWAY_REQUEST, GATEWAY_REQUEST_VALUE);
            requestTemplate.header(HEADER_INTERNAL_SERVICE, SERVICE_NAME);
            requestTemplate.header(HEADER_SERVICE_AUTH, SERVICE_AUTH_VALUE);
        };
    }
}

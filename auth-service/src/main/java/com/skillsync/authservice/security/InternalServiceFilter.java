package com.skillsync.authservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Custom filter to allow Feign internal service-to-service calls
 * Checks for X-Service-Auth header and allows /internal/** endpoints
 */
@Component
public class InternalServiceFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        String serviceAuth = request.getHeader("X-Service-Auth");
        String internalService = request.getHeader("X-Internal-Service");
        
        // Check if this is an internal endpoint call from another service
        // Support both /internal/** and /auth/internal/** paths (gateway adds /auth prefix)
        boolean isInternalPath = requestPath.startsWith("/internal/") || requestPath.startsWith("/auth/internal/");
        
        if (isInternalPath && "true".equals(serviceAuth) && internalService != null) {
            logger.info("✅ Allowing internal service request from: " + internalService);
            
            // Create an authentication token so the request passes security checks
            // Must provide at least one authority - using ROLE_INTERNAL_SERVICE
            Authentication auth = new AnonymousAuthenticationToken(
                "internal-service", 
                "service-account", 
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_INTERNAL_SERVICE"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        
        filterChain.doFilter(request, response);
    }
}

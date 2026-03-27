package com.skillsync.authservice.filter;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class GatewayRequestFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String gatewayHeader = request.getHeader("X-Gateway-Request");
        String serviceAuth = request.getHeader("X-Service-Auth");
        String internalService = request.getHeader("X-Internal-Service");
        String requestPath = request.getRequestURI();

        // Allow internal service-to-service calls (from other microservices)
        // Check if this is an internal endpoint with proper service-to-service headers
        boolean isInternalPath = requestPath.startsWith("/internal/") || requestPath.startsWith("/auth/internal/");
        boolean isInternalServiceCall = "true".equals(serviceAuth) && internalService != null;

        if (isInternalPath && isInternalServiceCall) {
            // Allow internal service-to-service calls to bypass gateway header check
            filterChain.doFilter(request, response);
            return;
        }

        // Allow Swagger/OpenAPI documentation endpoints without gateway header
        boolean isSwaggerPath = requestPath.startsWith("/v3/api-docs") || 
                               requestPath.startsWith("/swagger-ui") ||
                               requestPath.startsWith("/swagger-resources");
        if (isSwaggerPath) {
            filterChain.doFilter(request, response);
            return;
        }

        // Regular requests must come through API Gateway with X-Gateway-Request header
        if (gatewayHeader == null) {
        	// 1. Set the status
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            // 2. Explicitly set content type
            response.setContentType("text/plain");
            // 3. Write the message and flush it immediately
            response.getWriter().write("Access Denied: Use API Gateway");
            response.getWriter().flush(); 
            response.getWriter().close();
            return; // Stop the chain here
        }

        filterChain.doFilter(request, response);
    }
}
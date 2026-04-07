package com.skillsync.review.filter;

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

        String requestPath = request.getRequestURI();
        
        // Allow internal service-to-service endpoints
        if (requestPath.contains("/internal/")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Whitelist Swagger/OpenAPI and actuator paths
        if (requestPath.startsWith("/actuator") ||
            requestPath.startsWith("/v3/api-docs") || 
            requestPath.startsWith("/swagger-ui") ||
            requestPath.startsWith("/swagger-resources")) {
            filterChain.doFilter(request, response);
            return;
        }

        String gatewayHeader = request.getHeader("X-Gateway-Request");
        String serviceAuth = request.getHeader("X-Service-Auth");

        boolean isGatewayRequest = gatewayHeader != null;
        boolean isInternalServiceRequest = "true".equals(serviceAuth);

        if (!isGatewayRequest && !isInternalServiceRequest) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("text/plain");
            response.getWriter().write("Access Denied: Request must come through API Gateway or be an authorized internal service call");
            response.getWriter().flush(); 
            response.getWriter().close();
            return;
        }

        filterChain.doFilter(request, response);
    }
}

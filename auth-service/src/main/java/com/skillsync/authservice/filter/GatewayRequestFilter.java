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

    private static final String HEADER_GATEWAY_REQUEST  = "X-Gateway-Request";
    private static final String HEADER_SERVICE_AUTH     = "X-Service-Auth";
    private static final String HEADER_INTERNAL_SERVICE = "X-Internal-Service";
    private static final String SERVICE_AUTH_VALUE      = "true";

    private static final String INTERNAL_PATH_PREFIX      = "/internal/";
    private static final String AUTH_INTERNAL_PATH_PREFIX = "/auth/internal/";
    private static final String ACTUATOR_PATH_PREFIX       = "/actuator";
    private static final String API_DOCS_PATH_PREFIX       = "/v3/api-docs";
    private static final String SWAGGER_UI_PATH_PREFIX     = "/swagger-ui";
    private static final String SWAGGER_RESOURCES_PREFIX   = "/swagger-resources";

    private static final String ACCESS_DENIED_MESSAGE = "Access Denied: Use API Gateway";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String gatewayHeader   = request.getHeader(HEADER_GATEWAY_REQUEST);
        String serviceAuth     = request.getHeader(HEADER_SERVICE_AUTH);
        String internalService = request.getHeader(HEADER_INTERNAL_SERVICE);
        String requestPath     = request.getRequestURI();

        boolean isInternalPath        = requestPath.startsWith(INTERNAL_PATH_PREFIX)
                || requestPath.startsWith(AUTH_INTERNAL_PATH_PREFIX);
        boolean isInternalServiceCall = SERVICE_AUTH_VALUE.equals(serviceAuth) && internalService != null;

        if (isInternalPath && isInternalServiceCall) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean isSwaggerPath = requestPath.startsWith(ACTUATOR_PATH_PREFIX)
                || requestPath.startsWith(API_DOCS_PATH_PREFIX)
                || requestPath.startsWith(SWAGGER_UI_PATH_PREFIX)
                || requestPath.startsWith(SWAGGER_RESOURCES_PREFIX);

        if (isSwaggerPath) {
            filterChain.doFilter(request, response);
            return;
        }

        if (gatewayHeader == null) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("text/plain");
            response.getWriter().write(ACCESS_DENIED_MESSAGE);
            response.getWriter().flush();
            response.getWriter().close();
            return;
        }

        filterChain.doFilter(request, response);
    }
}

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

@Component
public class InternalServiceFilter extends OncePerRequestFilter {

    private static final String HEADER_SERVICE_AUTH       = "X-Service-Auth";
    private static final String HEADER_INTERNAL_SERVICE   = "X-Internal-Service";
    private static final String SERVICE_AUTH_VALUE        = "true";
    private static final String INTERNAL_ROLE             = "ROLE_INTERNAL_SERVICE";
    private static final String INTERNAL_PATH_PREFIX      = "/internal/";
    private static final String AUTH_INTERNAL_PATH_PREFIX = "/auth/internal/";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath     = request.getRequestURI();
        String serviceAuth     = request.getHeader(HEADER_SERVICE_AUTH);
        String internalService = request.getHeader(HEADER_INTERNAL_SERVICE);

        boolean isInternalPath = requestPath.startsWith(INTERNAL_PATH_PREFIX)
                || requestPath.startsWith(AUTH_INTERNAL_PATH_PREFIX);

        if (isInternalPath && SERVICE_AUTH_VALUE.equals(serviceAuth) && internalService != null) {
            logger.info("Allowing internal service request from: " + internalService);
            Authentication auth = new AnonymousAuthenticationToken(
                    "internal-service",
                    "service-account",
                    Collections.singletonList(new SimpleGrantedAuthority(INTERNAL_ROLE))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}

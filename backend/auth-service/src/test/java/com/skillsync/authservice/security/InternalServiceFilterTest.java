package com.skillsync.authservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class InternalServiceFilterTest {

    @InjectMocks
    private InternalServiceFilter internalServiceFilter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_shouldAuthenticateInternalService() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/internal/test");
        when(request.getHeader("X-Service-Auth")).thenReturn("true");
        when(request.getHeader("X-Internal-Service")).thenReturn("test-service");

        internalServiceFilter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getAuthorities()).extracting("authority").contains("ROLE_INTERNAL_SERVICE");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldAuthenticateAuthInternalPath() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/auth/internal/test");
        when(request.getHeader("X-Service-Auth")).thenReturn("true");
        when(request.getHeader("X-Internal-Service")).thenReturn("test-service");

        internalServiceFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }

    @Test
    void doFilterInternal_shouldNotAuthenticate_whenNotInternalPath() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/auth/login");
        when(request.getHeader("X-Service-Auth")).thenReturn("true");
        when(request.getHeader("X-Internal-Service")).thenReturn("test-service");

        internalServiceFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_shouldNotAuthenticate_whenAuthHeaderFalse() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/internal/test");
        when(request.getHeader("X-Service-Auth")).thenReturn("false");
        when(request.getHeader("X-Internal-Service")).thenReturn("test-service");

        internalServiceFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_shouldNotAuthenticate_whenInternalServiceHeaderMissing() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/internal/test");
        when(request.getHeader("X-Service-Auth")).thenReturn("true");
        when(request.getHeader("X-Internal-Service")).thenReturn(null);

        internalServiceFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}


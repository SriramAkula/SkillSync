package com.skillsync.review.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GatewayRequestFilterTest {

    private GatewayRequestFilter filter;

    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new GatewayRequestFilter();
    }

    @Test
    void doFilterInternal_shouldPass_whenInternalPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/review/internal/stats");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldPass_whenSwaggerPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/v3/api-docs");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldPass_whenSwaggerUiPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/swagger-ui/index.html");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldPass_whenSwaggerResourcesPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/swagger-resources/configuration/ui");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldPass_whenActuatorPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/actuator/health");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldPass_whenGatewayHeaderPresent() throws Exception {
        when(request.getRequestURI()).thenReturn("/review/1");
        when(request.getHeader("X-Gateway-Request")).thenReturn("true");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldPass_whenInternalServiceAuthPresent() throws Exception {
        when(request.getRequestURI()).thenReturn("/review/1");
        when(request.getHeader("X-Gateway-Request")).thenReturn(null);
        when(request.getHeader("X-Service-Auth")).thenReturn("true");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldDeny_whenNoHeaders() throws Exception {
        when(request.getRequestURI()).thenReturn("/review/1");
        when(request.getHeader("X-Gateway-Request")).thenReturn(null);
        when(request.getHeader("X-Service-Auth")).thenReturn(null);
        
        StringWriter stringWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(writer);

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(any(), any());
    }
}

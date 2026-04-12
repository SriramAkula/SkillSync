package com.skillsync.notification.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GatewayRequestFilterTest {

    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain filterChain;

    @InjectMocks private GatewayRequestFilter gatewayRequestFilter;

    @Test
    void doFilter_shouldAllowInternalPaths() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/notification/internal/sync");

        gatewayRequestFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_shouldAllowWithGatewayHeader() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/notification/list");
        when(request.getHeader("X-Gateway-Request")).thenReturn("true");

        gatewayRequestFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_shouldDenyWithoutGatewayHeader() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/notification/list");
        when(request.getHeader("X-Gateway-Request")).thenReturn(null);
        
        StringWriter stringWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(writer);

        gatewayRequestFilter.doFilter(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void doFilter_shouldAllowActuatorPaths() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/actuator/health");
        gatewayRequestFilter.doFilter(request, response, filterChain);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_shouldAllowV3ApiDocsPaths() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/v3/api-docs");
        gatewayRequestFilter.doFilter(request, response, filterChain);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_shouldAllowSwaggerUiPaths() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/swagger-ui/index.html");
        gatewayRequestFilter.doFilter(request, response, filterChain);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_shouldAllowSwaggerResourcesPaths() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/swagger-resources");
        gatewayRequestFilter.doFilter(request, response, filterChain);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldHandleMissingEmailAndRole() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/notifications");
        when(request.getHeader("X-Gateway-Request")).thenReturn("true");
        // No email or role headers
        
        gatewayRequestFilter.doFilterInternal(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
}

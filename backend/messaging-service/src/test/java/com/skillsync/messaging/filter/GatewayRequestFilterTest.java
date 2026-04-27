package com.skillsync.messaging.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

    @InjectMocks
    private GatewayRequestFilter gatewayRequestFilter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
    }

    @Test
    @DisplayName("Filter - Internal path bypasses gateway check")
    void doFilterInternal_InternalPath_BypassesCheck() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/internal/messages");

        gatewayRequestFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(request, never()).getHeader("X-Gateway-Request");
    }

    @Test
    @DisplayName("Filter - Whitelisted paths bypass gateway check")
    void doFilterInternal_WhitelistedPaths_BypassesCheck() throws ServletException, IOException {
        String[] whitelisted = {
            "/actuator/health", 
            "/v3/api-docs", 
            "/swagger-ui/index.html",
            "/swagger-resources/configuration/ui",
            "/messaging/v3/api-docs"
        };

        for (String path : whitelisted) {
            reset(request, response, filterChain);
            when(request.getRequestURI()).thenReturn(path);
            
            gatewayRequestFilter.doFilterInternal(request, response, filterChain);
            
            verify(filterChain).doFilter(request, response);
        }
    }

    @Test
    @DisplayName("Filter - Request with gateway header proceeds")
    void doFilterInternal_WithGatewayHeader_Proceeds() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/messaging/test");
        when(request.getHeader("X-Gateway-Request")).thenReturn("true");

        gatewayRequestFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Filter - Request without gateway header is forbidden")
    void doFilterInternal_WithoutGatewayHeader_ReturnsForbidden() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/messaging/test");
        when(request.getHeader("X-Gateway-Request")).thenReturn(null);
        
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        gatewayRequestFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(response).setContentType("text/plain");
        verify(filterChain, never()).doFilter(request, response);
    }
}

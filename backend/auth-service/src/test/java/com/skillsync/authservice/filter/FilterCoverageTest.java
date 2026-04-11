package com.skillsync.authservice.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.authservice.dto.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FilterCoverageTest {

    // ─── GatewayRequestFilter ────────────────────────────────────

    @InjectMocks private GatewayRequestFilter gatewayRequestFilter;
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain filterChain;

    @Test
    void gatewayFilter_shouldDeny_whenNoHeaderAndNotSwagger() throws Exception {
        when(request.getHeader("X-Gateway-Request")).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/auth/login");
        
        StringWriter sw = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(sw));

        gatewayRequestFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        assertThat(sw.toString()).contains("Access Denied: Use API Gateway");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void gatewayFilter_shouldAllow_whenGatewayHeaderPresent() throws Exception {
        when(request.getHeader("X-Gateway-Request")).thenReturn("true");
        when(request.getRequestURI()).thenReturn("/auth/login");

        gatewayRequestFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void gatewayFilter_shouldAllow_whenSwaggerPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/swagger-ui/index.html");

        gatewayRequestFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void gatewayFilter_shouldAllow_whenInternalPathAndServiceAuth() throws Exception {
        when(request.getRequestURI()).thenReturn("/internal/users/1/profile");
        when(request.getHeader("X-Service-Auth")).thenReturn("true");
        when(request.getHeader("X-Internal-Service")).thenReturn("user-service");

        gatewayRequestFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    // ─── ForbiddenResponseFilter ─────────────────────────────────

    @InjectMocks private ForbiddenResponseFilter forbiddenResponseFilter;

    @Test
    void forbiddenFilter_shouldWrapAndConverttoJSON_on403() throws Exception {
        HttpServletResponse httpResponse = mock(HttpServletResponse.class);
        StringWriter sw = new StringWriter();
        when(httpResponse.getWriter()).thenReturn(new PrintWriter(sw));
        
        // Simulate chain setting status to 403
        doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(403);
            return null;
        }).when(filterChain).doFilter(any(), any());

        forbiddenResponseFilter.doFilter(request, httpResponse, filterChain);

        verify(httpResponse).setContentType(MediaType.APPLICATION_JSON_VALUE);
        assertThat(sw.toString()).contains("Forbidden: You don't have permission");
    }

    @Test
    void forbiddenFilter_shouldNotWrap_ifAlreadyJson() throws Exception {
        HttpServletResponse httpResponse = mock(HttpServletResponse.class);
        when(httpResponse.getContentType()).thenReturn("application/json");
        
        doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(403);
            return null;
        }).when(filterChain).doFilter(any(), any());

        forbiddenResponseFilter.doFilter(request, httpResponse, filterChain);

        // Should not have called getWriter() on httpResponse for the wrap (it captures it in wrapper anyway)
        verify(httpResponse, never()).getWriter();
    }

    @Test
    void forbiddenFilter_shouldDoNothing_whenStatusNot403() throws Exception {
        HttpServletResponse httpResponse = mock(HttpServletResponse.class);
        
        doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(200);
            return null;
        }).when(filterChain).doFilter(any(), any());

        forbiddenResponseFilter.doFilter(request, httpResponse, filterChain);

        verify(httpResponse, never()).setContentType(any());
    }

    // ─── ForbiddenAwareResponseWrapper ───────────────────────────

    @Test
    void forbiddenWrapper_shouldTrackStatus() throws Exception {
        HttpServletResponse mockResp = mock(HttpServletResponse.class);
        ForbiddenAwareResponseWrapper wrapper = new ForbiddenAwareResponseWrapper(mockResp);
        
        wrapper.setStatus(400);
        assertThat(wrapper.getStatus()).isEqualTo(400);
        verify(mockResp).setStatus(400);
        
        wrapper.sendError(500);
        assertThat(wrapper.getStatus()).isEqualTo(500);
        verify(mockResp).sendError(500);
        
        wrapper.sendError(403, "Msg");
        assertThat(wrapper.getStatus()).isEqualTo(403);
        verify(mockResp).sendError(403, "Msg");
    }
}

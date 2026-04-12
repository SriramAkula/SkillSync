package com.skillsync.authservice.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class FilterTests {

    private GatewayRequestFilter gatewayRequestFilter;
    private ForbiddenResponseFilter forbiddenResponseFilter;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        gatewayRequestFilter = new GatewayRequestFilter();
        forbiddenResponseFilter = new ForbiddenResponseFilter();
    }

    @Test
    void gatewayRequestFilter_shouldAllow_whenInternalServiceCall() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/internal/anything");
        request.addHeader("X-Internal-Service", "some-service");
        request.addHeader("X-Service-Auth", "true");
        MockHttpServletResponse response = new MockHttpServletResponse();

        gatewayRequestFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void gatewayRequestFilter_shouldAllow_whenSwaggerPath() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/actuator/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        gatewayRequestFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void gatewayRequestFilter_shouldDeny_whenNoGatewayHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/auth/login");
        MockHttpServletResponse response = new MockHttpServletResponse();

        gatewayRequestFilter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("Access Denied");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void gatewayRequestFilter_shouldAllow_whenGatewayHeaderPresent() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/user/profile");
        request.addHeader("X-Gateway-Request", "true");
        MockHttpServletResponse response = new MockHttpServletResponse();

        gatewayRequestFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void forbiddenResponseFilter_shouldWrapAndHandle403() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        doAnswer(invocation -> {
            HttpServletResponse resp = (HttpServletResponse) invocation.getArguments()[1];
            resp.sendError(403);
            return null;
        }).when(filterChain).doFilter(any(), any());

        forbiddenResponseFilter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).contains("application/json");
        assertThat(response.getContentAsString()).contains("Forbidden");
    }

    @Test
    void forbiddenResponseFilter_shouldNotWrap_whenNot403() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        forbiddenResponseFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(any(), any());
        assertThat(response.getStatus()).isNotEqualTo(403);
    }

    @Test
    void forbiddenResponseFilter_shouldNotWrap_whenAlreadyJson() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        doAnswer(invocation -> {
            HttpServletResponse resp = (HttpServletResponse) invocation.getArguments()[1];
            resp.setStatus(403);
            resp.setContentType("application/json");
            resp.getWriter().write("{\"error\":\"custom\"}");
            return null;
        }).when(filterChain).doFilter(any(), any());

        forbiddenResponseFilter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).isEqualTo("{\"error\":\"custom\"}");
    }
}

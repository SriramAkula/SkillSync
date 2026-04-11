package com.skillsync.authservice.security;

import com.skillsync.authservice.config.JwtConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class JwtFilterTest {

    private JwtUtil jwtUtil;
    private JwtFilter jwtFilter;

    @Mock private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        JwtConfig config = new JwtConfig();
        config.setSecret("testSecretKey123456789012345678901234567890123456789");
        config.setExpiration(3600000L);
        jwtUtil = new JwtUtil(config);
        jwtFilter = new JwtFilter(jwtUtil);
    }

    @Test
    void doFilterInternal_shouldPassThrough_forPublicEndpoints() throws Exception {
        String[] publicPaths = {"/auth/register", "/auth/login", "/auth/refresh",
                "/internal/users/1", "/v3/api-docs", "/swagger-ui/index.html"};

        for (String path : publicPaths) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
            MockHttpServletResponse response = new MockHttpServletResponse();
            jwtFilter.doFilterInternal(request, response, filterChain);
        }

        verify(filterChain, times(publicPaths.length)).doFilter(any(), any());
    }

    @Test
    void doFilterInternal_shouldPassThrough_forSpecificPublicEndpoint() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/auth/swagger-ui.html");
        MockHttpServletResponse response = new MockHttpServletResponse();
        jwtFilter.doFilterInternal(request, response, filterChain);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldSetAuthentication_whenValidToken() throws Exception {
        String token = jwtUtil.generateToken(1L, "test@example.com", List.of("ROLE_LEARNER"));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/some/protected");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldContinue_whenNoAuthHeader() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/some/protected");
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldContinue_whenInvalidToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/some/protected");
        request.addHeader("Authorization", "Bearer invalid.token.here");
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldContinue_whenAuthHeaderNotBearer() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/some/protected");
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_shouldNotReAuthenticate_ifAlreadyAuthenticated() throws Exception {
        org.springframework.security.core.Authentication existingAuth = mock(org.springframework.security.core.Authentication.class);
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(existingAuth);
        
        String token = jwtUtil.generateToken(1L, "test@example.com", List.of("ROLE_LEARNER"));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/protected");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        // SecurityContext should still have the old one
        assertThat(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()).isEqualTo(existingAuth);
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }
}

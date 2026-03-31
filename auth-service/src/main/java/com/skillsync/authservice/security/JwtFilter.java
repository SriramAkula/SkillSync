package com.skillsync.authservice.security;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final String HEADER_AUTHORIZATION = "Authorization";
    private static final String BEARER_PREFIX        = "Bearer ";

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (isPublicEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader(HEADER_AUTHORIZATION);
        String token = null;
        String email = null;

        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            token = authHeader.substring(BEARER_PREFIX.length());
            try {
                email = jwtUtil.extractEmail(token);
            } catch (Exception e) {
                System.out.println("JWT Error: " + e.getMessage());
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.isTokenValid(token)) {
                List<String> roles = jwtUtil.extractRoles(token);
                List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path) {
        return path.equals("/auth/register")
                || path.equals("/auth/login")
                || path.equals("/auth/refresh")
                || path.startsWith("/internal/")
                || path.contains("/v3/api-docs")
                || path.contains("/swagger-ui")
                || path.contains("/swagger-resources")
                || path.equals("/auth/swagger-ui.html")
                || path.contains("/error");
    }
}

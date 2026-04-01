package com.skillsync.apiGateway.filter;

import com.skillsync.apiGateway.util.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    @Autowired
    private JwtUtil jwtUtil;

    // List of public endpoints that don't need a JWT
    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/auth/send-otp",
            "/api/auth/verify-otp",
            "/api/auth/forgot-password",
            "/api/auth/verify-forgot-password",
            "/api/auth/reset-password",
            "/api/auth/oauth/google",
            "/auth/login",
            "/auth/register",
            "/auth/refresh",
            "/auth/send-otp",
            "/auth/verify-otp",
            "/auth/forgot-password",
            "/auth/verify-forgot-password",
            "/auth/reset-password",
            "/auth/oauth/google",
            "/api/payment/payments",
            "/eureka",
            "/swagger-ui",
            "/swagger-resources",
            "/v3/api-docs",
            "/webjars/"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // 1. Mark the request as coming from the Gateway
        request = request.mutate()
                .header("X-Gateway-Request", "true")
                .build();

        // 2. Security Check
        if (isSecured(request)) {
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                return this.onError(exchange, "Missing authorization header", HttpStatus.UNAUTHORIZED);
            }

            String authHeader = request.getHeaders().getOrEmpty(HttpHeaders.AUTHORIZATION).get(0);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return this.onError(exchange, "Invalid authorization header format", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            try {
                jwtUtil.validateToken(token);
                Claims claims = jwtUtil.getClaims(token);
                
                // We use email as the subject in our updated Auth Service
                String email = claims.getSubject();
                Long userId = claims.get("userId", Long.class);

                // Extract roles from the JWT (Unified Role System)
                String roles = "";
                if (claims.get("roles") != null) {
                    List<?> roleList = (List<?>) claims.get("roles");
                    roles = String.join(",", roleList.stream().map(Object::toString).toList());
                }

                // 3. Forward identity to downstream microservices
                request = request.mutate()
                        .header("X-User-Id", userId != null ? userId.toString() : "")
                        .header("loggedInUser", email) // Downstream services can use this to identify the user
                        .header("roles", roles)        // Downstream services use this for @PreAuthorize
                        .build();

            } catch (Exception e) {
                return this.onError(exchange, "Unauthorized access: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
            }
        }

        return chain.filter(exchange.mutate().request(request).build());
    }

    private boolean isSecured(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        
        // Special case: Allow all /*/v3/api-docs** paths (swagger docs for all services)
        if (path.contains("/v3/api-docs")) {
            return false;
        }
        
        // Check if path matches any public endpoint pattern
        return PUBLIC_ENDPOINTS.stream()
                .noneMatch(endpoint -> {
                    if (endpoint.endsWith("/")) {
                        // For endpoints ending with /, do prefix match
                        return path.startsWith(endpoint);
                    } else {
                        // For endpoints without trailing /, do exact or prefix match with wildcard support
                        return path.equals(endpoint) || path.startsWith(endpoint + "/");
                    }
                });
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        // You can optionally add the error message to the body here
        exchange.getResponse().setStatusCode(httpStatus);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -1; // Run before other filters
    }
}
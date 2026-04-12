package com.skillsync.apiGateway.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.skillsync.apiGateway.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock private JwtUtil jwtUtil;
    @Mock private GatewayFilterChain chain;
    @InjectMocks private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        lenient().when(chain.filter(any())).thenReturn(Mono.empty());
    }

    @Test
    void filter_shouldSkip_whenOptionsMethod() {
        MockServerHttpRequest request = MockServerHttpRequest.options("/any").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(chain).filter(exchange);
    }

    @Test
    void filter_shouldSkip_whenPublicEndpoint() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/auth/login").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(chain).filter(any(ServerWebExchange.class));
    }

    @Test
    void filter_shouldReturn401_whenMissingAuthHeader() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/secured").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void filter_shouldReturn401_whenMalformedAuthHeader() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/secured")
                .header(HttpHeaders.AUTHORIZATION, "InvalidFormat")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void filter_shouldReturn401_whenJwtValidationFails() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/secured")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        doThrow(new RuntimeException("Expired")).when(jwtUtil).validateToken(anyString());

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void filter_shouldForwardIdentity_whenTokenIsValid() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/secured")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        Claims claims = new DefaultClaims(Map.of(
                "sub", "user@test.com",
                "userId", 123L,
                "roles", List.of("ROLE_USER", "ROLE_ADMIN")
        ));
        when(jwtUtil.getClaims(anyString())).thenReturn(claims);

        filter.filter(exchange, chain).block();

        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(chain).filter(captor.capture());

        HttpHeaders headers = captor.getValue().getRequest().getHeaders();
        assertThat(headers.getFirst("X-User-Id")).isEqualTo("123");
        assertThat(headers.getFirst("loggedInUser")).isEqualTo("user@test.com");
        assertThat(headers.getFirst("roles")).isEqualTo("ROLE_USER,ROLE_ADMIN");
        assertThat(headers.getFirst("X-Gateway-Request")).isEqualTo("true");
    }

    @Test
    void filter_shouldHandleNullRolesAndUserId() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/secured")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        Claims claims = new DefaultClaims(Map.of("sub", "user@test.com"));
        when(jwtUtil.getClaims(anyString())).thenReturn(claims);

        filter.filter(exchange, chain).block();

        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(chain).filter(captor.capture());

        HttpHeaders headers = captor.getValue().getRequest().getHeaders();
        assertThat(headers.getFirst("X-User-Id")).isEqualTo("");
        assertThat(headers.getFirst("roles")).isEqualTo("");
    }

    @Test
    void isSecured_shouldHitTrailingSlashPrefixMatch() {
        // "/webjars/" is a prefix match in PUBLIC_ENDPOINTS
        MockServerHttpRequest request = MockServerHttpRequest.get("/webjars/some-inner-file").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(jwtUtil, never()).validateToken(anyString());
    }

    @Test
    void isSecured_shouldHitWildcardPrefixMatch() {
        // "/api/auth/login" also matches "/api/auth/login/anything"
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/auth/login/extra").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(jwtUtil, never()).validateToken(anyString());
    }

    @Test
    void isSecured_shouldInternalSwaggerDocMatch() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/any-service/v3/api-docs").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, chain).block();

        verify(jwtUtil, never()).validateToken(anyString());
    }

    @Test
    void getOrder_shouldReturnCorrectValue() {
        assertThat(filter.getOrder()).isEqualTo(-1);
    }
}

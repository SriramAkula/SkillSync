package com.skillsync.user.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityContextUtilTest {

    private static final String SECRET = "verysecretkeythatislongenoughforhmacsha256";
    private SecurityContextUtil securityContextUtil;

    @Mock
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        securityContextUtil = new SecurityContextUtil(SECRET);
    }

    private String createToken(Long userId, String email, Date expiration) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        
        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .expiration(expiration)
                .signWith(key)
                .compact();
    }

    @Test
    void extractUserId_shouldReturnUserId_whenTokenValid() {
        String token = createToken(10L, "user@example.com", new Date(System.currentTimeMillis() + 10000));
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        Long userId = securityContextUtil.extractUserId(request);

        assertThat(userId).isEqualTo(10L);
    }

    @Test
    void extractUserId_shouldReturnNull_whenHeaderMissing() {
        when(request.getHeader("Authorization")).thenReturn(null);
        assertThat(securityContextUtil.extractUserId(request)).isNull();
    }

    @Test
    void extractEmail_shouldReturnEmail() {
        String token = createToken(10L, "user@example.com", new Date(System.currentTimeMillis() + 10000));
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        String email = securityContextUtil.extractEmail(request);

        assertThat(email).isEqualTo("user@example.com");
    }

    @Test
    void isTokenValid_shouldReturnTrue_whenValid() {
        String token = createToken(10L, "user@example.com", new Date(System.currentTimeMillis() + 10000));
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        assertThat(securityContextUtil.isTokenValid(request)).isTrue();
    }

    @Test
    void isTokenValid_shouldReturnFalse_whenExpired() {
        String token = createToken(10L, "user@example.com", new Date(System.currentTimeMillis() - 10000));
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        assertThat(securityContextUtil.isTokenValid(request)).isFalse();
    }

    @Test
    void extractUserId_shouldReturnLong_whenInternalInteger() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", 123); // Integer
        String token = Jwts.builder().claims(claims).signWith(key).compact();
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        Long userId = securityContextUtil.extractUserId(request);
        assertThat(userId).isEqualTo(123L);
    }

    @Test
    void extractUserId_shouldReturnNull_whenUserIdString() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", "invalid");
        String token = Jwts.builder().claims(claims).signWith(key).compact();
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        assertThat(securityContextUtil.extractUserId(request)).isNull();
    }

    @Test
    void extractUserId_shouldReturnNull_whenInvalidToken() {
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid.token.here");
        assertThat(securityContextUtil.extractUserId(request)).isNull();
    }

    @Test
    void extractEmail_shouldReturnNull_whenHeaderMissing() {
        when(request.getHeader("Authorization")).thenReturn(null);
        assertThat(securityContextUtil.extractEmail(request)).isNull();
    }

    @Test
    void extractEmail_shouldReturnNull_whenInvalidToken() {
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid.token");
        assertThat(securityContextUtil.extractEmail(request)).isNull();
    }

    @Test
    void extractUserId_shouldReturnLong_whenInternalLong() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", 3000000000L); // Larger than max int to force Long type
        String token = Jwts.builder().claims(claims).signWith(key).compact();
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        Long userId = securityContextUtil.extractUserId(request);
        assertThat(userId).isEqualTo(3000000000L);
    }

    @Test
    void extractUserId_shouldReturnNull_whenHeaderNotBearer() {
        when(request.getHeader("Authorization")).thenReturn("Basic token");
        assertThat(securityContextUtil.extractUserId(request)).isNull();
    }

    @Test
    void isTokenValid_shouldReturnFalse_whenHeaderMissing() {
        when(request.getHeader("Authorization")).thenReturn(null);
        assertThat(securityContextUtil.isTokenValid(request)).isFalse();
    }
}

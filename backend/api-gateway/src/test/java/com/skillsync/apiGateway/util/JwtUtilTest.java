package com.skillsync.apiGateway.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Date;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private String secret = "mysecretkeymustbelongerthan32charssoletsmakeitareallylongone123456";
    private SecretKey key;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", secret);
        jwtUtil.init();
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    @Test
    void validateToken_shouldSucceed_whenValid() {
        String token = Jwts.builder()
                .subject("test@test.com")
                .signWith(key)
                .compact();

        jwtUtil.validateToken(token);
    }

    @Test
    void validateToken_shouldThrow_whenInvalid() {
        assertThrows(Exception.class, () -> jwtUtil.validateToken("invalid-token"));
    }

    @Test
    void getClaims_shouldReturnPayload() {
        String token = Jwts.builder()
                .subject("test@test.com")
                .claim("userId", 100L)
                .signWith(key)
                .compact();

        Claims claims = jwtUtil.getClaims(token);
        assertThat(claims.getSubject()).isEqualTo("test@test.com");
        assertThat(claims.get("userId", Long.class)).isEqualTo(100L);
    }
}

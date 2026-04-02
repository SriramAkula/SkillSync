package com.skillsync.authservice.security;

import com.skillsync.authservice.config.JwtConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        JwtConfig config = new JwtConfig();
        config.setSecret("testSecretKey123456789012345678901234567890123456789");
        config.setExpiration(3600000L);
        jwtUtil = new JwtUtil(config);
    }

    @Test
    void generateToken_shouldReturnNonNullToken() {
        String token = jwtUtil.generateToken(1L, "test@example.com", "testuser", List.of("ROLE_LEARNER"));
        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    void extractEmail_shouldReturnCorrectEmail() {
        String token = jwtUtil.generateToken(1L, "test@example.com", "testuser", List.of("ROLE_LEARNER"));
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("test@example.com");
    }

    @Test
    void extractUserId_shouldReturnCorrectId() {
        String token = jwtUtil.generateToken(42L, "test@example.com", "testuser", List.of("ROLE_LEARNER"));
        assertThat(jwtUtil.extractUserId(token)).isEqualTo(42L);
    }

    @Test
    void extractRoles_shouldReturnCorrectRoles() {
        String token = jwtUtil.generateToken(1L, "test@example.com", "testuser", List.of("ROLE_LEARNER", "ROLE_MENTOR"));
        assertThat(jwtUtil.extractRoles(token)).containsExactly("ROLE_LEARNER", "ROLE_MENTOR");
    }

    @Test
    void isTokenValid_shouldReturnTrue_forFreshToken() {
        String token = jwtUtil.generateToken(1L, "test@example.com", "testuser", List.of("ROLE_LEARNER"));
        assertThat(jwtUtil.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_shouldReturnFalse_forGarbageToken() {
        assertThat(jwtUtil.isTokenValid("not.a.valid.token")).isFalse();
    }

    @Test
    void isTokenExpired_shouldReturnFalse_forFreshToken() {
        String token = jwtUtil.generateToken(1L, "test@example.com", "testuser", List.of("ROLE_LEARNER"));
        assertThat(jwtUtil.isTokenExpired(token)).isFalse();
    }

    @Test
    void extractUsername_shouldReturnCorrectUsername() {
        String token = jwtUtil.generateToken(1L, "test@example.com", "testuser", List.of("ROLE_LEARNER"));
        assertThat(jwtUtil.extractUsername(token)).isEqualTo("testuser");
    }
}

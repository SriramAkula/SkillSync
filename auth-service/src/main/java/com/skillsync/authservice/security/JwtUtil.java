package com.skillsync.authservice.security;

import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.skillsync.authservice.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private final JwtConfig jwtConfig;
    private final SecretKey key;

    public JwtUtil(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
        this.key = Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes());
    }

    // generate token
    public String generateToken(Long userId, String email, List<String> roles) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("roles", roles) 
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtConfig.getExpiration()))
                .signWith(key)
                .compact();
    }

    // internal method
    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // extract email
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    // extract userId
    public Long extractUserId(String token) {
        return extractClaims(token).get("userId", Long.class);
    }

    // extract roles
    public List<String> extractRoles(String token) {
        return extractClaims(token).get("roles", List.class);
    }

    // check expiration
    public boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }

    // validate token
    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }
}


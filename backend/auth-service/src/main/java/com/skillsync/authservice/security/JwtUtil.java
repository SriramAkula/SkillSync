package com.skillsync.authservice.security;

import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.skillsync.authservice.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
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

    // generate access token (short-lived: 1 hour)
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

    // generate refresh token (long-lived: 7 days)
    public String generateRefreshToken(Long userId, String email, List<String> roles) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("roles", roles)
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtConfig.getRefreshExpiration()))
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

    // extract email — works even if token is expired (used for refresh)
    public String extractEmailIgnoreExpiry(String token) {
        try {
            return extractClaims(token).getSubject();
        } catch (ExpiredJwtException e) {
            return e.getClaims().getSubject();
        } catch (JwtException e) {
            return null;
        }
    }

    // extract email
    public String extractEmail(String token) {
        try {
            return extractClaims(token).getSubject();
        } catch (JwtException e) {
            return null;
        }
    }

    // extract userId
    public Long extractUserId(String token) {
        try {
            return extractClaims(token).get("userId", Long.class);
        } catch (JwtException e) {
            return null;
        }
    }

    // extract roles
    public List<String> extractRoles(String token) {
        try {
            return extractClaims(token).get("roles", List.class);
        } catch (JwtException e) {
            return null;
        }
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

    // validate refresh token (checks expiry AND type claim)
    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = extractClaims(token);
            boolean isExpired = claims.getExpiration().before(new Date());
            String type = claims.get("type", String.class);
            return !isExpired && "refresh".equals(type);
        } catch (JwtException e) {
            return false;
        }
    }
}


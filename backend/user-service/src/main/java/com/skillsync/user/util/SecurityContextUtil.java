package com.skillsync.user.util;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class SecurityContextUtil {

    private final SecretKey key;

    public SecurityContextUtil(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Extracts the userId from the Authorization header of the request.
     * Fulfills the requirement to identify the user from the JWT, not headers.
     */
    public Long extractUserId(HttpServletRequest request) {
        try {
            Claims claims = extractClaims(request);
            if (claims == null) return null;
            
            Object userIdObj = claims.get("userId");
            if (userIdObj instanceof Integer) {
                return ((Integer) userIdObj).longValue();
            } else if (userIdObj instanceof Long) {
                return (Long) userIdObj;
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to extract userId from JWT: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extracts the email (subject) from the Authorization header of the request.
     */
    public String extractEmail(HttpServletRequest request) {
        try {
            Claims claims = extractClaims(request);
            return (claims != null) ? claims.getSubject() : null;
        } catch (Exception e) {
            log.error("Failed to extract email from JWT: {}", e.getMessage());
            return null;
        }
    }

    private Claims extractClaims(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7);
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    public boolean isTokenValid(HttpServletRequest request) {
        try {
            Claims claims = extractClaims(request);
            return claims != null && !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}

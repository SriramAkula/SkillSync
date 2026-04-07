package com.skillsync.authservice.dto.response;

import java.util.List;

public record AuthResponse(
    String token,
    String refreshToken,
    List<String> roles,
    String username,
    Long userId,
    String email
) {}
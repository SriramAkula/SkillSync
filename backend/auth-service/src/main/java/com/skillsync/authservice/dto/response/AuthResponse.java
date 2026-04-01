package com.skillsync.authservice.dto.response;

import java.util.List;

public record AuthResponse(

    String token,
    List<String> roles

) {}
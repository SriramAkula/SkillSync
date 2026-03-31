package com.skillsync.authservice.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleTokenRequest(

    @NotBlank(message = "idToken is required")
    String idToken
) {}

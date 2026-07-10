package com.lmfinanz.identity.adapter.in.web.dto;

import java.util.Set;
import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String email,
        String fullName,
        Set<String> roles,
        String accessToken,
        String refreshToken
) {
}

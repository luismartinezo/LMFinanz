package com.lmfinanz.identity.adapter.in.web.dto;

import com.lmfinanz.identity.domain.model.RoleName;
import java.util.Set;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String fullName,
        boolean active,
        Set<RoleName> roles
) {
}

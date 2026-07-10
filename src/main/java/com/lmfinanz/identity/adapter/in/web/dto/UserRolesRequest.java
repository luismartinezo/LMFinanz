package com.lmfinanz.identity.adapter.in.web.dto;

import com.lmfinanz.identity.domain.model.RoleName;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public record UserRolesRequest(
        @NotEmpty Set<RoleName> roles
) {
}

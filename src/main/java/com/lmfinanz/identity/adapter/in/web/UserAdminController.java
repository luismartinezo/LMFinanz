package com.lmfinanz.identity.adapter.in.web;

import com.lmfinanz.identity.adapter.in.web.dto.AdminUserResponse;
import com.lmfinanz.identity.adapter.in.web.dto.UserRolesRequest;
import com.lmfinanz.identity.application.port.in.UserAdminUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Users", description = "Administrative user and role management")
public class UserAdminController {

    private final UserAdminUseCase userAdminUseCase;

    public UserAdminController(UserAdminUseCase userAdminUseCase) {
        this.userAdminUseCase = userAdminUseCase;
    }

    @GetMapping
    @Operation(summary = "List users", description = "Lists all users with active status and assigned roles. Requires ROLE_ADMIN.")
    public List<AdminUserResponse> list() {
        return userAdminUseCase.list();
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user", description = "Returns one user with active status and roles. Requires ROLE_ADMIN.")
    public AdminUserResponse get(@PathVariable UUID userId) {
        return userAdminUseCase.get(userId);
    }

    @PatchMapping("/{userId}/activate")
    @Operation(summary = "Activate user", description = "Activates a deactivated user account. Requires ROLE_ADMIN.")
    public AdminUserResponse activate(@PathVariable UUID userId) {
        return userAdminUseCase.activate(userId);
    }

    @PatchMapping("/{userId}/deactivate")
    @Operation(summary = "Deactivate user", description = "Deactivates another user account. Admins cannot deactivate themselves.")
    public AdminUserResponse deactivate(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID userId
    ) {
        return userAdminUseCase.deactivate(principal.userId(), userId);
    }

    @PutMapping("/{userId}/roles")
    @Operation(summary = "Replace user roles", description = "Replaces the roles assigned to a user. Admins cannot remove their own ROLE_ADMIN.")
    public AdminUserResponse replaceRoles(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID userId,
            @Valid @RequestBody UserRolesRequest request
    ) {
        return userAdminUseCase.replaceRoles(principal.userId(), userId, request);
    }
}

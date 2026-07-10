package com.lmfinanz.identity.adapter.in.web;

import com.lmfinanz.identity.adapter.in.web.dto.AdminUserResponse;
import com.lmfinanz.identity.adapter.in.web.dto.UserRolesRequest;
import com.lmfinanz.identity.application.port.in.UserAdminUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
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
public class UserAdminController {

    private final UserAdminUseCase userAdminUseCase;

    public UserAdminController(UserAdminUseCase userAdminUseCase) {
        this.userAdminUseCase = userAdminUseCase;
    }

    @GetMapping
    public List<AdminUserResponse> list() {
        return userAdminUseCase.list();
    }

    @GetMapping("/{userId}")
    public AdminUserResponse get(@PathVariable UUID userId) {
        return userAdminUseCase.get(userId);
    }

    @PatchMapping("/{userId}/activate")
    public AdminUserResponse activate(@PathVariable UUID userId) {
        return userAdminUseCase.activate(userId);
    }

    @PatchMapping("/{userId}/deactivate")
    public AdminUserResponse deactivate(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID userId
    ) {
        return userAdminUseCase.deactivate(principal.userId(), userId);
    }

    @PutMapping("/{userId}/roles")
    public AdminUserResponse replaceRoles(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID userId,
            @Valid @RequestBody UserRolesRequest request
    ) {
        return userAdminUseCase.replaceRoles(principal.userId(), userId, request);
    }
}

package com.lmfinanz.identity.application.service;

import com.lmfinanz.identity.adapter.in.web.dto.AdminUserResponse;
import com.lmfinanz.identity.adapter.in.web.dto.UserRolesRequest;
import com.lmfinanz.identity.application.port.in.UserAdminUseCase;
import com.lmfinanz.identity.application.port.out.RoleRepositoryPort;
import com.lmfinanz.identity.application.port.out.UserRepositoryPort;
import com.lmfinanz.identity.domain.model.Role;
import com.lmfinanz.identity.domain.model.RoleName;
import com.lmfinanz.identity.domain.model.User;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.exception.NotFoundException;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserAdminService implements UserAdminUseCase {

    private final UserRepositoryPort userRepository;
    private final RoleRepositoryPort roleRepository;

    public UserAdminService(UserRepositoryPort userRepository, RoleRepositoryPort roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<AdminUserResponse> list() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse get(UUID userId) {
        return toResponse(findUser(userId));
    }

    @Override
    public AdminUserResponse activate(UUID userId) {
        User user = findUser(userId);
        user.activate();
        return toResponse(userRepository.save(user));
    }

    @Override
    public AdminUserResponse deactivate(UUID currentUserId, UUID userId) {
        if (currentUserId.equals(userId)) {
            throw new DomainException("Administrators cannot deactivate their own account");
        }
        User user = findUser(userId);
        user.deactivate();
        return toResponse(userRepository.save(user));
    }

    @Override
    public AdminUserResponse replaceRoles(UUID currentUserId, UUID userId, UserRolesRequest request) {
        if (currentUserId.equals(userId) && !request.roles().contains(RoleName.ROLE_ADMIN)) {
            throw new DomainException("Administrators cannot remove their own admin role");
        }
        Set<Role> roles = request.roles().stream()
                .map(this::findRole)
                .collect(Collectors.toUnmodifiableSet());
        User user = findUser(userId);
        user.replaceRoles(roles);
        return toResponse(userRepository.save(user));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Role findRole(RoleName roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new DomainException("Role is not configured: " + roleName.name()));
    }

    private AdminUserResponse toResponse(User user) {
        Set<RoleName> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toUnmodifiableSet());
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.isActive(),
                roles
        );
    }
}

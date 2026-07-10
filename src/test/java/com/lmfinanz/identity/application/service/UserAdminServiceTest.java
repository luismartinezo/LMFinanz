package com.lmfinanz.identity.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.lmfinanz.identity.adapter.in.web.dto.UserRolesRequest;
import com.lmfinanz.identity.application.port.out.RoleRepositoryPort;
import com.lmfinanz.identity.application.port.out.UserRepositoryPort;
import com.lmfinanz.identity.domain.model.Role;
import com.lmfinanz.identity.domain.model.RoleName;
import com.lmfinanz.identity.domain.model.User;
import com.lmfinanz.shared.domain.exception.DomainException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserAdminServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private RoleRepositoryPort roleRepository;

    @Test
    void listsUsersWithRoles() {
        UserAdminService service = new UserAdminService(userRepository, roleRepository);
        User user = user("user@lmfinanz.com");
        user.addRole(new Role(RoleName.ROLE_USER));
        when(userRepository.findAll()).thenReturn(List.of(user));

        var users = service.list();

        assertThat(users).hasSize(1);
        assertThat(users.getFirst().email()).isEqualTo("user@lmfinanz.com");
        assertThat(users.getFirst().roles()).containsExactly(RoleName.ROLE_USER);
    }

    @Test
    void deactivatesAnotherUser() {
        UserAdminService service = new UserAdminService(userRepository, roleRepository);
        UUID adminId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        User user = user("user@lmfinanz.com");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        var response = service.deactivate(adminId, userId);

        assertThat(response.active()).isFalse();
    }

    @Test
    void rejectsSelfDeactivation() {
        UserAdminService service = new UserAdminService(userRepository, roleRepository);
        UUID adminId = UUID.randomUUID();

        assertThatThrownBy(() -> service.deactivate(adminId, adminId))
                .isInstanceOf(DomainException.class)
                .hasMessage("Administrators cannot deactivate their own account");
    }

    @Test
    void replacesUserRoles() {
        UserAdminService service = new UserAdminService(userRepository, roleRepository);
        UUID adminId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        User user = user("user@lmfinanz.com");
        Role adminRole = new Role(RoleName.ROLE_ADMIN);
        when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        var response = service.replaceRoles(adminId, userId, new UserRolesRequest(Set.of(RoleName.ROLE_ADMIN)));

        assertThat(response.roles()).containsExactly(RoleName.ROLE_ADMIN);
    }

    @Test
    void rejectsRemovingOwnAdminRole() {
        UserAdminService service = new UserAdminService(userRepository, roleRepository);
        UUID adminId = UUID.randomUUID();

        assertThatThrownBy(() -> service.replaceRoles(
                adminId,
                adminId,
                new UserRolesRequest(Set.of(RoleName.ROLE_USER))
        ))
                .isInstanceOf(DomainException.class)
                .hasMessage("Administrators cannot remove their own admin role");
    }

    private User user(String email) {
        return new User(email, "hash", "Test User");
    }
}

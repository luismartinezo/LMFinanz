package com.lmfinanz.identity.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lmfinanz.identity.adapter.in.web.dto.LoginRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RegisterUserRequest;
import com.lmfinanz.identity.application.port.out.RoleRepositoryPort;
import com.lmfinanz.identity.application.port.out.UserRepositoryPort;
import com.lmfinanz.identity.domain.model.Role;
import com.lmfinanz.identity.domain.model.RoleName;
import com.lmfinanz.identity.domain.model.User;
import com.lmfinanz.shared.domain.exception.AuthenticationFailedException;
import com.lmfinanz.shared.domain.exception.ConflictException;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.security.JwtPrincipal;
import com.lmfinanz.shared.security.JwtTokenPort;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private RoleRepositoryPort roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenPort jwtTokenPort;

    @Test
    void registersNormalizedUserWithDefaultRole() {
        AuthService service = service();
        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
        when(roleRepository.findByName(RoleName.ROLE_USER)).thenReturn(Optional.of(new Role(RoleName.ROLE_USER)));
        when(passwordEncoder.encode("StrongPass123!")).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtTokenPort.issueToken(any(JwtPrincipal.class))).thenReturn("token");

        var response = service.register(new RegisterUserRequest(" User@Example.com ", "StrongPass123!", "Luis"));

        assertThat(response.email()).isEqualTo("user@example.com");
        assertThat(response.roles()).containsExactly(RoleName.ROLE_USER.name());
        assertThat(response.accessToken()).isEqualTo("token");
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("hash");
    }

    @Test
    void rejectsDuplicateEmail() {
        AuthService service = service();
        when(userRepository.existsByEmail("user@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(
                new RegisterUserRequest("user@example.com", "StrongPass123!", "Luis")
        )).isInstanceOf(ConflictException.class);
    }

    @Test
    void rejectsWeakPassword() {
        AuthService service = service();

        assertThatThrownBy(() -> service.register(
                new RegisterUserRequest("user@example.com", "password123", "Luis")
        ))
                .isInstanceOf(DomainException.class)
                .hasMessage("Password must include uppercase, lowercase, number, and special character");
    }

    @Test
    void rejectsInvalidPasswordWithoutExposingCause() {
        AuthService service = service();
        User user = new User("user@example.com", "hash", "Luis");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("user@example.com", "wrong-password")))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage("Invalid email or password");
    }

    private AuthService service() {
        return new AuthService(userRepository, roleRepository, passwordEncoder, jwtTokenPort);
    }
}

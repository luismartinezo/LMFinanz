package com.lmfinanz.identity.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lmfinanz.identity.adapter.in.web.dto.LoginRequest;
import com.lmfinanz.identity.adapter.in.web.dto.LogoutRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RefreshTokenRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RegisterUserRequest;
import com.lmfinanz.identity.application.port.out.RefreshTokenRepositoryPort;
import com.lmfinanz.identity.application.port.out.RoleRepositoryPort;
import com.lmfinanz.identity.application.port.out.UserRepositoryPort;
import com.lmfinanz.identity.domain.model.RefreshToken;
import com.lmfinanz.identity.domain.model.Role;
import com.lmfinanz.identity.domain.model.RoleName;
import com.lmfinanz.identity.domain.model.User;
import com.lmfinanz.shared.domain.exception.AuthenticationFailedException;
import com.lmfinanz.shared.domain.exception.ConflictException;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.security.JwtPrincipal;
import com.lmfinanz.shared.security.JwtTokenPort;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private RoleRepositoryPort roleRepository;

    @Mock
    private RefreshTokenRepositoryPort refreshTokenRepository;

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
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtTokenPort.issueToken(any(JwtPrincipal.class))).thenReturn("token");

        var response = service.register(new RegisterUserRequest(" User@Example.com ", "StrongPass123!", "Luis"));

        assertThat(response.email()).isEqualTo("user@example.com");
        assertThat(response.roles()).containsExactly(RoleName.ROLE_USER.name());
        assertThat(response.accessToken()).isEqualTo("token");
        assertThat(response.refreshToken()).isNotBlank();
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("hash");
        verify(refreshTokenRepository).save(any(RefreshToken.class));
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

    @Test
    void refreshesAndRotatesRefreshToken() {
        AuthService service = service();
        java.util.UUID userId = java.util.UUID.randomUUID();
        User user = new User("user@example.com", "hash", "Luis");
        ReflectionTestUtils.setField(user, "id", userId);
        user.addRole(new Role(RoleName.ROLE_USER));
        RefreshToken refreshToken = new RefreshToken(
                userId,
                hash("refresh-token"),
                Instant.now().plusSeconds(3600)
        );
        when(refreshTokenRepository.findByTokenHash(hash("refresh-token"))).thenReturn(Optional.of(refreshToken));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtTokenPort.issueToken(any(JwtPrincipal.class))).thenReturn("new-token");

        var response = service.refresh(new RefreshTokenRequest("refresh-token"));

        assertThat(response.accessToken()).isEqualTo("new-token");
        assertThat(response.refreshToken()).isNotBlank();
        assertThat(refreshToken.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(refreshToken);
        verify(refreshTokenRepository).save(argThat(token -> token != refreshToken && token.getUserId().equals(userId)));
    }

    @Test
    void rejectsRevokedRefreshToken() {
        AuthService service = service();
        RefreshToken refreshToken = new RefreshToken(
                java.util.UUID.randomUUID(),
                hash("refresh-token"),
                Instant.now().plusSeconds(3600)
        );
        refreshToken.revoke(Instant.now());
        when(refreshTokenRepository.findByTokenHash(hash("refresh-token"))).thenReturn(Optional.of(refreshToken));

        assertThatThrownBy(() -> service.refresh(new RefreshTokenRequest("refresh-token")))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void logoutRevokesRefreshToken() {
        AuthService service = service();
        RefreshToken refreshToken = new RefreshToken(
                java.util.UUID.randomUUID(),
                hash("refresh-token"),
                Instant.now().plusSeconds(3600)
        );
        when(refreshTokenRepository.findByTokenHash(hash("refresh-token"))).thenReturn(Optional.of(refreshToken));
        when(refreshTokenRepository.save(refreshToken)).thenReturn(refreshToken);

        service.logout(new LogoutRequest("refresh-token"));

        assertThat(refreshToken.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(refreshToken);
    }

    private AuthService service() {
        return new AuthService(userRepository, roleRepository, refreshTokenRepository, passwordEncoder, jwtTokenPort, 30);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}

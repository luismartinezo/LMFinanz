package com.lmfinanz.identity.application.service;

import com.lmfinanz.identity.adapter.in.web.dto.AuthResponse;
import com.lmfinanz.identity.adapter.in.web.dto.LoginRequest;
import com.lmfinanz.identity.adapter.in.web.dto.LogoutRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RefreshTokenRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RegisterUserRequest;
import com.lmfinanz.identity.application.port.in.AuthUseCase;
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
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService implements AuthUseCase {

    private final UserRepositoryPort userRepository;
    private final RoleRepositoryPort roleRepository;
    private final RefreshTokenRepositoryPort refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenPort jwtTokenPort;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long refreshExpirationDays;

    public AuthService(
            UserRepositoryPort userRepository,
            RoleRepositoryPort roleRepository,
            RefreshTokenRepositoryPort refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenPort jwtTokenPort,
            @Value("${security.jwt.refresh-expiration-days}") long refreshExpirationDays
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenPort = jwtTokenPort;
        this.refreshExpirationDays = refreshExpirationDays;
    }

    @Override
    public AuthResponse register(RegisterUserRequest request) {
        String email = normalizeEmail(request.email());
        validatePasswordPolicy(request.password());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account already exists for this email");
        }

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new DomainException("Default user role is not configured"));
        User user = new User(email, passwordEncoder.encode(request.password()), request.fullName().trim());
        user.addRole(userRole);

        return authenticatedResponse(userRepository.save(user), issueRefreshToken(user));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(this::invalidCredentials);
        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return authenticatedResponse(user, issueRefreshToken(user));
    }

    @Override
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hashToken(request.refreshToken()))
                .orElseThrow(this::invalidCredentials);
        Instant now = Instant.now();
        if (refreshToken.isRevoked() || refreshToken.isExpired(now)) {
            throw invalidCredentials();
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(this::invalidCredentials);
        if (!user.isActive()) {
            throw invalidCredentials();
        }

        refreshToken.revoke(now);
        refreshTokenRepository.save(refreshToken);
        return authenticatedResponse(user, issueRefreshToken(user));
    }

    @Override
    public void logout(LogoutRequest request) {
        refreshTokenRepository.findByTokenHash(hashToken(request.refreshToken()))
                .filter(token -> !token.isRevoked())
                .ifPresent(token -> {
                    token.revoke(Instant.now());
                    refreshTokenRepository.save(token);
                });
    }

    private AuthResponse authenticatedResponse(User user, String refreshToken) {
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
        String token = jwtTokenPort.issueToken(new JwtPrincipal(user.getId(), user.getEmail(), roles));
        return new AuthResponse(user.getId(), user.getEmail(), user.getFullName(), roles, token, refreshToken);
    }

    private AuthenticationFailedException invalidCredentials() {
        return new AuthenticationFailedException("Invalid email or password");
    }

    private void validatePasswordPolicy(String password) {
        if (password.length() < 10
                || password.length() > 120
                || password.chars().noneMatch(Character::isUpperCase)
                || password.chars().noneMatch(Character::isLowerCase)
                || password.chars().noneMatch(Character::isDigit)
                || password.chars().allMatch(Character::isLetterOrDigit)) {
            throw new DomainException("Password must include uppercase, lowercase, number, and special character");
        }
    }

    private String issueRefreshToken(User user) {
        String token = randomToken();
        refreshTokenRepository.save(new RefreshToken(
                user.getId(),
                hashToken(token),
                Instant.now().plus(refreshExpirationDays, ChronoUnit.DAYS)
        ));
        return token;
    }

    private String randomToken() {
        byte[] bytes = new byte[64];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm is not available", ex);
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

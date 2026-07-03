package com.lmfinanz.identity.application.service;

import com.lmfinanz.identity.adapter.in.web.dto.AuthResponse;
import com.lmfinanz.identity.adapter.in.web.dto.LoginRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RegisterUserRequest;
import com.lmfinanz.identity.application.port.in.AuthUseCase;
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
import java.util.Locale;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService implements AuthUseCase {

    private final UserRepositoryPort userRepository;
    private final RoleRepositoryPort roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenPort jwtTokenPort;

    public AuthService(
            UserRepositoryPort userRepository,
            RoleRepositoryPort roleRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenPort jwtTokenPort
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenPort = jwtTokenPort;
    }

    @Override
    public AuthResponse register(RegisterUserRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account already exists for this email");
        }

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new DomainException("Default user role is not configured"));
        User user = new User(email, passwordEncoder.encode(request.password()), request.fullName().trim());
        user.addRole(userRole);

        return authenticatedResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(this::invalidCredentials);
        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return authenticatedResponse(user);
    }

    private AuthResponse authenticatedResponse(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
        String token = jwtTokenPort.issueToken(new JwtPrincipal(user.getId(), user.getEmail(), roles));
        return new AuthResponse(user.getId(), user.getEmail(), user.getFullName(), roles, token);
    }

    private AuthenticationFailedException invalidCredentials() {
        return new AuthenticationFailedException("Invalid email or password");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

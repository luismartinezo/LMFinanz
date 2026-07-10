package com.lmfinanz.identity.adapter.in.web;

import com.lmfinanz.identity.adapter.in.web.dto.AuthResponse;
import com.lmfinanz.identity.adapter.in.web.dto.LoginRequest;
import com.lmfinanz.identity.adapter.in.web.dto.LogoutRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RefreshTokenRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RegisterUserRequest;
import com.lmfinanz.identity.application.port.in.AuthUseCase;
import com.lmfinanz.identity.application.service.LoginRateLimiter;
import com.lmfinanz.shared.domain.exception.AuthenticationFailedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User registration and JWT login")
public class AuthController {

    private final AuthUseCase authUseCase;
    private final LoginRateLimiter loginRateLimiter;

    public AuthController(AuthUseCase authUseCase, LoginRateLimiter loginRateLimiter) {
        this.authUseCase = authUseCase;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register user", description = "Creates a new user account with ROLE_USER and returns access and refresh tokens.")
    public AuthResponse register(@Valid @RequestBody RegisterUserRequest request) {
        return authUseCase.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates an active user and returns access and refresh tokens.")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = clientIp(httpRequest);
        loginRateLimiter.assertAllowed(request.email(), clientIp);
        try {
            AuthResponse response = authUseCase.login(request);
            loginRateLimiter.clear(request.email(), clientIp);
            return response;
        } catch (AuthenticationFailedException ex) {
            loginRateLimiter.recordFailure(request.email(), clientIp);
            throw ex;
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Rotates a valid refresh token and returns a new access token and refresh token.")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authUseCase.refresh(request);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Revokes the provided refresh token.")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authUseCase.logout(request);
        return ResponseEntity.noContent().build();
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

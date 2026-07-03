package com.lmfinanz.identity.adapter.in.web;

import com.lmfinanz.identity.adapter.in.web.dto.AuthResponse;
import com.lmfinanz.identity.adapter.in.web.dto.LoginRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RegisterUserRequest;
import com.lmfinanz.identity.application.port.in.AuthUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthUseCase authUseCase;

    public AuthController(AuthUseCase authUseCase) {
        this.authUseCase = authUseCase;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterUserRequest request) {
        return authUseCase.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authUseCase.login(request);
    }
}

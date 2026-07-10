package com.lmfinanz.identity.application.port.in;

import com.lmfinanz.identity.adapter.in.web.dto.AuthResponse;
import com.lmfinanz.identity.adapter.in.web.dto.LoginRequest;
import com.lmfinanz.identity.adapter.in.web.dto.LogoutRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RefreshTokenRequest;
import com.lmfinanz.identity.adapter.in.web.dto.RegisterUserRequest;

public interface AuthUseCase {

    AuthResponse register(RegisterUserRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(LogoutRequest request);
}

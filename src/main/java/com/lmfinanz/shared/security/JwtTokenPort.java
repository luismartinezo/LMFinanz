package com.lmfinanz.shared.security;

public interface JwtTokenPort {

    String issueToken(JwtPrincipal principal);

    JwtPrincipal validateToken(String token);
}

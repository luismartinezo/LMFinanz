package com.lmfinanz.identity.application.port.out;

import com.lmfinanz.identity.domain.model.RefreshToken;
import java.util.Optional;

public interface RefreshTokenRepositoryPort {

    RefreshToken save(RefreshToken refreshToken);

    Optional<RefreshToken> findByTokenHash(String tokenHash);
}

package com.lmfinanz.identity.adapter.out.persistence;

import com.lmfinanz.identity.application.port.out.RefreshTokenRepositoryPort;
import com.lmfinanz.identity.domain.model.RefreshToken;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class RefreshTokenPersistenceAdapter implements RefreshTokenRepositoryPort {

    private final SpringDataRefreshTokenRepository repository;

    public RefreshTokenPersistenceAdapter(SpringDataRefreshTokenRepository repository) {
        this.repository = repository;
    }

    @Override
    public RefreshToken save(RefreshToken refreshToken) {
        return repository.save(refreshToken);
    }

    @Override
    public Optional<RefreshToken> findByTokenHash(String tokenHash) {
        return repository.findByTokenHash(tokenHash);
    }
}

package com.lmfinanz.identity.adapter.out.persistence;

import com.lmfinanz.identity.application.port.out.UserRepositoryPort;
import com.lmfinanz.identity.domain.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class UserPersistenceAdapter implements UserRepositoryPort {

    private final SpringDataUserRepository repository;

    public UserPersistenceAdapter(SpringDataUserRepository repository) {
        this.repository = repository;
    }

    @Override
    public User save(User user) {
        return repository.save(user);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return repository.findByEmailIgnoreCase(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmailIgnoreCase(email);
    }
}

package com.lmfinanz.identity.application.port.out;

import com.lmfinanz.identity.domain.model.User;
import java.util.Optional;
import java.util.UUID;

public interface UserRepositoryPort {

    User save(User user);

    Optional<User> findById(UUID id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}

package com.lmfinanz.identity.application.port.out;

import com.lmfinanz.identity.domain.model.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepositoryPort {

    User save(User user);

    Optional<User> findById(UUID id);

    List<User> findAll();

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}

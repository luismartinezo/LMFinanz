package com.lmfinanz.identity.adapter.out.persistence;

import com.lmfinanz.identity.domain.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataUserRepository extends JpaRepository<User, UUID> {

    @EntityGraph(attributePaths = "roles")
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}

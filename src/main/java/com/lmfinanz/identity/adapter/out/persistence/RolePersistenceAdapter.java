package com.lmfinanz.identity.adapter.out.persistence;

import com.lmfinanz.identity.application.port.out.RoleRepositoryPort;
import com.lmfinanz.identity.domain.model.Role;
import com.lmfinanz.identity.domain.model.RoleName;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class RolePersistenceAdapter implements RoleRepositoryPort {

    private final SpringDataRoleRepository repository;

    public RolePersistenceAdapter(SpringDataRoleRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Role> findByName(RoleName name) {
        return repository.findByName(name);
    }
}

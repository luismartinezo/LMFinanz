package com.lmfinanz.identity.adapter.out.persistence;

import com.lmfinanz.identity.domain.model.Role;
import com.lmfinanz.identity.domain.model.RoleName;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataRoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(RoleName name);
}

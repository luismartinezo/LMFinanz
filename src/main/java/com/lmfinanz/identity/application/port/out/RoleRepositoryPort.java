package com.lmfinanz.identity.application.port.out;

import com.lmfinanz.identity.domain.model.Role;
import com.lmfinanz.identity.domain.model.RoleName;
import java.util.Optional;

public interface RoleRepositoryPort {

    Optional<Role> findByName(RoleName name);
}

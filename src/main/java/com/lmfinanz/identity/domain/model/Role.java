package com.lmfinanz.identity.domain.model;

import com.lmfinanz.shared.domain.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "roles")
public class Role extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 40)
    private RoleName name;

    protected Role() {
    }

    public Role(RoleName name) {
        this.name = name;
    }

    public RoleName getName() {
        return name;
    }
}

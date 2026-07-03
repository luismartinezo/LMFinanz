package com.lmfinanz.categories.domain.model;

import com.lmfinanz.shared.domain.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "categories")
public class Category extends BaseEntity {

    @Column(nullable = false)
    private UUID userId;

    private UUID parentCategoryId;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoryType type;

    @Column(nullable = false)
    private boolean systemDefined;

    @Column(nullable = false)
    private boolean active = true;

    protected Category() {
    }

    public Category(UUID userId, UUID parentCategoryId, String name, CategoryType type, boolean systemDefined) {
        this.userId = userId;
        this.parentCategoryId = parentCategoryId;
        this.name = name;
        this.type = type;
        this.systemDefined = systemDefined;
    }
}

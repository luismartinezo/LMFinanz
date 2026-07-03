package com.lmfinanz.categories.application.port.out;

import com.lmfinanz.categories.domain.model.Category;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepositoryPort {

    Category save(Category category);

    Optional<Category> findByIdAndUserId(UUID id, UUID userId);

    List<Category> findAllByUserId(UUID userId);
}

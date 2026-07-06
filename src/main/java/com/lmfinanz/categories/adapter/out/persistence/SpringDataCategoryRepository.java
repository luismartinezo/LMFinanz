package com.lmfinanz.categories.adapter.out.persistence;

import com.lmfinanz.categories.domain.model.Category;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataCategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByIdAndUserId(UUID id, UUID userId);

    List<Category> findAllByUserIdOrderByTypeAscNameAsc(UUID userId);
}

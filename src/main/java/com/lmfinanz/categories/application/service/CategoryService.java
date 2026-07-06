package com.lmfinanz.categories.application.service;

import com.lmfinanz.categories.adapter.in.web.dto.CategoryRequest;
import com.lmfinanz.categories.adapter.in.web.dto.CategoryResponse;
import com.lmfinanz.categories.application.port.in.CategoryUseCase;
import com.lmfinanz.categories.application.port.out.CategoryRepositoryPort;
import com.lmfinanz.categories.domain.model.Category;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.exception.NotFoundException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CategoryService implements CategoryUseCase {

    private final CategoryRepositoryPort categoryRepository;

    public CategoryService(CategoryRepositoryPort categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public CategoryResponse create(UUID userId, CategoryRequest request) {
        validateParent(userId, request);
        Category category = new Category(
                userId,
                request.parentCategoryId(),
                request.name().trim(),
                request.type(),
                false
        );
        return toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse get(UUID userId, UUID categoryId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Category not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> list(UUID userId) {
        return categoryRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateParent(UUID userId, CategoryRequest request) {
        if (request.parentCategoryId() == null) {
            return;
        }

        Category parent = categoryRepository.findByIdAndUserId(request.parentCategoryId(), userId)
                .orElseThrow(() -> new DomainException("Parent category not found"));

        if (parent.getType() != request.type()) {
            throw new DomainException("Parent category type must match category type");
        }
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getParentCategoryId(),
                category.getName(),
                category.getType(),
                category.isSystemDefined(),
                category.isActive()
        );
    }
}

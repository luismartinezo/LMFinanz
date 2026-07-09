package com.lmfinanz.categories.application.service;

import com.lmfinanz.categories.adapter.in.web.dto.CategoryRequest;
import com.lmfinanz.categories.adapter.in.web.dto.CategoryResponse;
import com.lmfinanz.categories.adapter.in.web.dto.CategoryUpdateRequest;
import com.lmfinanz.categories.application.port.in.CategoryUseCase;
import com.lmfinanz.categories.application.port.out.CategoryRepositoryPort;
import com.lmfinanz.categories.domain.model.Category;
import com.lmfinanz.categories.domain.model.CategoryType;
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

    @Override
    public CategoryResponse update(UUID userId, UUID categoryId, CategoryUpdateRequest request) {
        Category category = findCategory(userId, categoryId);
        validateEditable(category);
        validateParent(userId, categoryId, request.parentCategoryId(), category.getType());

        category.rename(request.name().trim());
        category.moveToParent(request.parentCategoryId());
        return toResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse deactivate(UUID userId, UUID categoryId) {
        Category category = findCategory(userId, categoryId);
        validateEditable(category);
        category.deactivate();
        return toResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse activate(UUID userId, UUID categoryId) {
        Category category = findCategory(userId, categoryId);
        validateEditable(category);
        category.activate();
        return toResponse(categoryRepository.save(category));
    }

    private void validateParent(UUID userId, CategoryRequest request) {
        validateParent(userId, null, request.parentCategoryId(), request.type());
    }

    private void validateParent(UUID userId, UUID categoryId, UUID parentCategoryId, CategoryType categoryType) {
        if (parentCategoryId == null) {
            return;
        }

        if (parentCategoryId.equals(categoryId)) {
            throw new DomainException("Category cannot be its own parent");
        }

        Category parent = categoryRepository.findByIdAndUserId(parentCategoryId, userId)
                .orElseThrow(() -> new DomainException("Parent category not found"));

        if (parent.getType() != categoryType) {
            throw new DomainException("Parent category type must match category type");
        }
    }

    private Category findCategory(UUID userId, UUID categoryId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new NotFoundException("Category not found"));
    }

    private void validateEditable(Category category) {
        if (category.isSystemDefined()) {
            throw new DomainException("System-defined categories cannot be modified");
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

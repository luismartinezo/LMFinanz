package com.lmfinanz.categories.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.lmfinanz.categories.adapter.in.web.dto.CategoryRequest;
import com.lmfinanz.categories.application.port.out.CategoryRepositoryPort;
import com.lmfinanz.categories.domain.model.Category;
import com.lmfinanz.categories.domain.model.CategoryType;
import com.lmfinanz.shared.domain.exception.DomainException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepositoryPort categoryRepository;

    @Test
    void createsRootCategory() {
        CategoryService service = new CategoryService(categoryRepository);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(UUID.randomUUID(), request(null, "Salary", CategoryType.INCOME));

        assertThat(response.name()).isEqualTo("Salary");
        assertThat(response.type()).isEqualTo(CategoryType.INCOME);
        assertThat(response.parentCategoryId()).isNull();
        assertThat(response.systemDefined()).isFalse();
        assertThat(response.active()).isTrue();
    }

    @Test
    void createsSubcategoryWhenParentBelongsToUserAndTypeMatches() {
        CategoryService service = new CategoryService(categoryRepository);
        UUID userId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Category parent = new Category(userId, null, "Food", CategoryType.EXPENSE, false);
        when(categoryRepository.findByIdAndUserId(parentId, userId)).thenReturn(Optional.of(parent));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(userId, request(parentId, "Groceries", CategoryType.EXPENSE));

        assertThat(response.name()).isEqualTo("Groceries");
        assertThat(response.parentCategoryId()).isEqualTo(parentId);
    }

    @Test
    void rejectsSubcategoryWhenParentTypeDoesNotMatch() {
        CategoryService service = new CategoryService(categoryRepository);
        UUID userId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Category parent = new Category(userId, null, "Food", CategoryType.EXPENSE, false);
        when(categoryRepository.findByIdAndUserId(parentId, userId)).thenReturn(Optional.of(parent));

        assertThatThrownBy(() -> service.create(userId, request(parentId, "Bonus", CategoryType.INCOME)))
                .isInstanceOf(DomainException.class)
                .hasMessage("Parent category type must match category type");
    }

    @Test
    void rejectsSubcategoryWhenParentDoesNotBelongToUser() {
        CategoryService service = new CategoryService(categoryRepository);
        UUID userId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        when(categoryRepository.findByIdAndUserId(parentId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(userId, request(parentId, "Groceries", CategoryType.EXPENSE)))
                .isInstanceOf(DomainException.class)
                .hasMessage("Parent category not found");
    }

    private CategoryRequest request(UUID parentCategoryId, String name, CategoryType type) {
        return new CategoryRequest(parentCategoryId, name, type);
    }
}

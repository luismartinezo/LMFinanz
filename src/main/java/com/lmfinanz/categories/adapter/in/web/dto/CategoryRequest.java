package com.lmfinanz.categories.adapter.in.web.dto;

import com.lmfinanz.categories.domain.model.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CategoryRequest(
        UUID parentCategoryId,
        @NotBlank @Size(max = 120) String name,
        @NotNull CategoryType type
) {
}

package com.lmfinanz.categories.adapter.in.web.dto;

import com.lmfinanz.categories.domain.model.CategoryType;
import java.util.UUID;

public record CategoryResponse(
        UUID id,
        UUID parentCategoryId,
        String name,
        CategoryType type,
        boolean systemDefined,
        boolean active
) {
}

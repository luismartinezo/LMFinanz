package com.lmfinanz.categories.application.port.in;

import com.lmfinanz.categories.adapter.in.web.dto.CategoryRequest;
import com.lmfinanz.categories.adapter.in.web.dto.CategoryResponse;
import java.util.List;
import java.util.UUID;

public interface CategoryUseCase {

    CategoryResponse create(UUID userId, CategoryRequest request);

    List<CategoryResponse> list(UUID userId);
}

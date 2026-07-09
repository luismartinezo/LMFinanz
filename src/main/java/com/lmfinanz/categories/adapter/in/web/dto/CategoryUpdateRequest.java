package com.lmfinanz.categories.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CategoryUpdateRequest(
        UUID parentCategoryId,
        @NotBlank @Size(max = 120) String name
) {
}

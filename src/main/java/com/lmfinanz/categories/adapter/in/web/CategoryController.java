package com.lmfinanz.categories.adapter.in.web;

import com.lmfinanz.categories.adapter.in.web.dto.CategoryRequest;
import com.lmfinanz.categories.adapter.in.web.dto.CategoryResponse;
import com.lmfinanz.categories.application.port.in.CategoryUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class CategoryController {

    private final CategoryUseCase categoryUseCase;

    public CategoryController(CategoryUseCase categoryUseCase) {
        this.categoryUseCase = categoryUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody CategoryRequest request
    ) {
        return categoryUseCase.create(principal.userId(), request);
    }

    @GetMapping("/{categoryId}")
    public CategoryResponse get(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID categoryId
    ) {
        return categoryUseCase.get(principal.userId(), categoryId);
    }

    @GetMapping
    public List<CategoryResponse> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return categoryUseCase.list(principal.userId());
    }
}

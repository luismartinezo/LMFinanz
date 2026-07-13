package com.lmfinanz.budgets.adapter.in.web;

import com.lmfinanz.budgets.adapter.in.web.dto.BudgetSummaryRequest;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetSummaryResponse;
import com.lmfinanz.budgets.application.port.in.BudgetSummaryUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/budget-summaries")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
@Tag(name = "Monthly budget summary", description = "Monthly income and budget totals per country and currency")
public class BudgetSummaryController {

    private final BudgetSummaryUseCase budgetSummaryUseCase;

    public BudgetSummaryController(BudgetSummaryUseCase budgetSummaryUseCase) {
        this.budgetSummaryUseCase = budgetSummaryUseCase;
    }

    @GetMapping
    @Operation(summary = "Get budget summary", description = "Gets monthly income configuration for one period.")
    public BudgetSummaryResponse get(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam int budgetYear,
            @RequestParam int budgetMonth,
            @RequestParam String countryCode,
            @RequestParam String currencyCode
    ) {
        return budgetSummaryUseCase.get(principal.userId(), budgetYear, budgetMonth, countryCode, currencyCode);
    }

    @PutMapping
    @Operation(summary = "Save budget summary", description = "Creates or updates monthly global income for one period.")
    public BudgetSummaryResponse save(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody BudgetSummaryRequest request
    ) {
        return budgetSummaryUseCase.save(principal.userId(), request);
    }
}

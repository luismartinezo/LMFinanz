package com.lmfinanz.budgets.adapter.in.web;

import com.lmfinanz.budgets.adapter.in.web.dto.BudgetItemPaymentRequest;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetItemRequest;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetItemResponse;
import com.lmfinanz.budgets.application.port.in.BudgetUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/budget-items")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
@Tag(name = "Monthly budget", description = "Monthly planned versus actual expense control")
public class BudgetController {

    private final BudgetUseCase budgetUseCase;

    public BudgetController(BudgetUseCase budgetUseCase) {
        this.budgetUseCase = budgetUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create budget item", description = "Creates a monthly planned obligation or expense.")
    public BudgetItemResponse create(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody BudgetItemRequest request
    ) {
        return budgetUseCase.create(principal.userId(), request);
    }

    @GetMapping
    @Operation(summary = "List budget items", description = "Lists budget items for one year and month, optionally filtered by country or currency.")
    public List<BudgetItemResponse> list(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam int budgetYear,
            @RequestParam int budgetMonth,
            @RequestParam(required = false) String countryCode,
            @RequestParam(required = false) String currencyCode
    ) {
        return budgetUseCase.list(principal.userId(), budgetYear, budgetMonth, countryCode, currencyCode);
    }

    @PutMapping("/{itemId}")
    @Operation(summary = "Update budget item", description = "Updates one monthly budget item.")
    public BudgetItemResponse update(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID itemId,
            @Valid @RequestBody BudgetItemRequest request
    ) {
        return budgetUseCase.update(principal.userId(), itemId, request);
    }

    @PatchMapping("/{itemId}/pay")
    @Operation(summary = "Mark budget item as paid", description = "Stores actual paid amount and paid date.")
    public BudgetItemResponse markPaid(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID itemId,
            @Valid @RequestBody BudgetItemPaymentRequest request
    ) {
        return budgetUseCase.markPaid(principal.userId(), itemId, request);
    }

    @PatchMapping("/{itemId}/unpay")
    @Operation(summary = "Mark budget item as unpaid", description = "Clears paid date and actual amount.")
    public BudgetItemResponse markUnpaid(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID itemId
    ) {
        return budgetUseCase.markUnpaid(principal.userId(), itemId);
    }
}

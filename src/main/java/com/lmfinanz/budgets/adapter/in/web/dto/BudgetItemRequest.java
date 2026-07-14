package com.lmfinanz.budgets.adapter.in.web.dto;

import com.lmfinanz.budgets.domain.model.BudgetItemType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetItemRequest(
        @Min(2000) int budgetYear,
        @Min(1) @Max(12) int budgetMonth,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
        @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currencyCode,
        @NotBlank @Size(max = 140) String name,
        BudgetItemType itemType,
        @NotNull @DecimalMin(value = "0.0000") BigDecimal plannedAmount,
        @DecimalMin(value = "0.0000") BigDecimal actualAmount,
        @Min(1) @Max(31) Integer dueDay,
        LocalDate dueDate,
        boolean paid,
        LocalDate paidDate,
        @Size(max = 500) String notes
) {
}

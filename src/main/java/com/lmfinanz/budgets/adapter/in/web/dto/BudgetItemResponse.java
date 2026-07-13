package com.lmfinanz.budgets.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BudgetItemResponse(
        UUID id,
        int budgetYear,
        int budgetMonth,
        String countryCode,
        String currencyCode,
        String name,
        BigDecimal plannedAmount,
        BigDecimal actualAmount,
        BigDecimal remainingAmount,
        Integer dueDay,
        LocalDate dueDate,
        boolean paid,
        LocalDate paidDate,
        String notes
) {
}

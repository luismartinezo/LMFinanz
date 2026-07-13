package com.lmfinanz.budgets.adapter.in.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BudgetSummaryResponse(
        UUID id,
        int budgetYear,
        int budgetMonth,
        String countryCode,
        String currencyCode,
        BigDecimal incomeAmount,
        String notes
) {
}

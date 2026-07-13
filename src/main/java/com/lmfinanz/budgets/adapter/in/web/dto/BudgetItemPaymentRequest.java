package com.lmfinanz.budgets.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetItemPaymentRequest(
        @DecimalMin(value = "0.0000") BigDecimal actualAmount,
        LocalDate paidDate
) {
}

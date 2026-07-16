package com.lmfinanz.debts.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DebtInstallmentRequest(
        @NotNull @DecimalMin(value = "0.0001") BigDecimal amount,
        @NotNull @DecimalMin(value = "0.0000") BigDecimal principalAmount,
        @NotNull @DecimalMin(value = "0.0000") BigDecimal interestAmount,
        @NotNull LocalDate dueDate
) {
}

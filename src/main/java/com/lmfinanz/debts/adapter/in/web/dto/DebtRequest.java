package com.lmfinanz.debts.adapter.in.web.dto;

import com.lmfinanz.debts.domain.model.DebtType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DebtRequest(
        @NotBlank @Size(max = 140) String name,
        @NotNull DebtType debtType,
        @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currencyCode,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
        @NotNull @DecimalMin(value = "0.0001") BigDecimal principalAmount,
        @NotNull @DecimalMin(value = "0.0000") BigDecimal annualInterestRate,
        @Min(1) int installments,
        @NotNull LocalDate startDate,
        @NotNull @FutureOrPresent LocalDate finalDueDate
) {
}

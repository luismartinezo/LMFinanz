package com.lmfinanz.savings.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalRequest(
        @NotBlank @Size(max = 140) String name,
        @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currencyCode,
        @NotNull @DecimalMin(value = "0.0001") BigDecimal targetAmount,
        @NotNull @Future LocalDate deadline
) {
}

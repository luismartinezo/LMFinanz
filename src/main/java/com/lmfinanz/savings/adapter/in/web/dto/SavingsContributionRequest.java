package com.lmfinanz.savings.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SavingsContributionRequest(
        UUID transactionId,
        @NotNull @DecimalMin(value = "0.0001") BigDecimal amount,
        @NotNull @PastOrPresent LocalDate contributionDate
) {
}

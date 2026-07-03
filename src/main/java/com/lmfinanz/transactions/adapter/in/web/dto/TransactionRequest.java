package com.lmfinanz.transactions.adapter.in.web.dto;

import com.lmfinanz.transactions.domain.model.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
        @NotNull TransactionType type,
        UUID sourceAccountId,
        UUID targetAccountId,
        UUID categoryId,
        @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currencyCode,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
        @NotNull @DecimalMin(value = "0.0001") BigDecimal amount,
        @NotNull @PastOrPresent LocalDate transactionDate,
        @Size(max = 500) String description
) {
}

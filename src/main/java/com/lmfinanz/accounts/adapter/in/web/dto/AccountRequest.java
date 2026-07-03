package com.lmfinanz.accounts.adapter.in.web.dto;

import com.lmfinanz.accounts.domain.model.AccountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record AccountRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull AccountType type,
        @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currencyCode,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
        @NotNull @DecimalMin(value = "-999999999999.9999") BigDecimal openingBalance
) {
}

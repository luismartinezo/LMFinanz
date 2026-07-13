package com.lmfinanz.accounts.adapter.in.web.dto;

import com.lmfinanz.accounts.domain.model.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record AccountUpdateRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull AccountType type,
        @NotNull BigDecimal currentBalance
) {
}

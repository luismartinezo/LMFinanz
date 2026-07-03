package com.lmfinanz.accounts.adapter.in.web.dto;

import com.lmfinanz.accounts.domain.model.AccountType;
import java.math.BigDecimal;
import java.util.UUID;

public record AccountResponse(
        UUID id,
        String name,
        AccountType type,
        String currencyCode,
        String countryCode,
        BigDecimal currentBalance,
        boolean active
) {
}

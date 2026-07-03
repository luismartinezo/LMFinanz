package com.lmfinanz.transactions.adapter.in.web.dto;

import com.lmfinanz.transactions.domain.model.TransactionStatus;
import com.lmfinanz.transactions.domain.model.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        TransactionType type,
        UUID sourceAccountId,
        UUID targetAccountId,
        UUID categoryId,
        String currencyCode,
        String countryCode,
        BigDecimal amount,
        LocalDate transactionDate,
        String description,
        TransactionStatus status
) {
}

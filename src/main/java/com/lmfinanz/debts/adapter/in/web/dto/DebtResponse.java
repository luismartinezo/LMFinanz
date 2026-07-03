package com.lmfinanz.debts.adapter.in.web.dto;

import com.lmfinanz.debts.domain.model.DebtStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DebtResponse(
        UUID id,
        String name,
        String currencyCode,
        BigDecimal principalAmount,
        BigDecimal annualInterestRate,
        int installments,
        LocalDate startDate,
        LocalDate finalDueDate,
        BigDecimal remainingBalance,
        DebtStatus status
) {
}

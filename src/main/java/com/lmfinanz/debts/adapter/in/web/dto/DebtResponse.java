package com.lmfinanz.debts.adapter.in.web.dto;

import com.lmfinanz.debts.domain.model.DebtStatus;
import com.lmfinanz.debts.domain.model.DebtType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DebtResponse(
        UUID id,
        String name,
        DebtType debtType,
        String currencyCode,
        String countryCode,
        BigDecimal principalAmount,
        BigDecimal annualInterestRate,
        BigDecimal installmentAmount,
        int installments,
        LocalDate startDate,
        LocalDate finalDueDate,
        BigDecimal remainingBalance,
        DebtStatus status
) {
}

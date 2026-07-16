package com.lmfinanz.debts.adapter.in.web.dto;

import com.lmfinanz.debts.domain.model.InstallmentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DebtInstallmentResponse(
        UUID id,
        UUID debtId,
        int installmentNumber,
        BigDecimal amount,
        BigDecimal principalAmount,
        BigDecimal interestAmount,
        LocalDate dueDate,
        LocalDate paidDate,
        BigDecimal paidAmount,
        UUID paymentTransactionId,
        InstallmentStatus status
) {
}

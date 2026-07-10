package com.lmfinanz.debts.adapter.in.web.dto;

import jakarta.validation.constraints.PastOrPresent;
import java.time.LocalDate;
import java.util.UUID;

public record DebtInstallmentPaymentRequest(
        @PastOrPresent LocalDate paidDate,
        UUID paymentTransactionId
) {
}

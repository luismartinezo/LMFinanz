package com.lmfinanz.debts.adapter.in.web.dto;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DebtInstallmentPaymentRequest(
        @NotNull @DecimalMin(value = "0.0001") BigDecimal paymentAmount,
        @PastOrPresent LocalDate paidDate,
        UUID paymentTransactionId
) {
}

package com.lmfinanz.savings.adapter.in.web.dto;

import com.lmfinanz.savings.domain.model.SavingsGoalStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SavingsGoalResponse(
        UUID id,
        String name,
        String currencyCode,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        LocalDate deadline,
        SavingsGoalStatus status
) {
}

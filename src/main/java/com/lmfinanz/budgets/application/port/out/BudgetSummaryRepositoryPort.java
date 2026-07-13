package com.lmfinanz.budgets.application.port.out;

import com.lmfinanz.budgets.domain.model.MonthlyBudgetSummary;
import java.util.Optional;
import java.util.UUID;

public interface BudgetSummaryRepositoryPort {

    MonthlyBudgetSummary save(MonthlyBudgetSummary summary);

    Optional<MonthlyBudgetSummary> findByPeriod(UUID userId, int budgetYear, int budgetMonth, String countryCode, String currencyCode);
}

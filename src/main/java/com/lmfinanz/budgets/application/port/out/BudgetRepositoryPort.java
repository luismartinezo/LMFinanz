package com.lmfinanz.budgets.application.port.out;

import com.lmfinanz.budgets.domain.model.MonthlyBudgetItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepositoryPort {

    MonthlyBudgetItem save(MonthlyBudgetItem item);

    Optional<MonthlyBudgetItem> findByIdAndUserId(UUID id, UUID userId);

    List<MonthlyBudgetItem> findAllByPeriod(UUID userId, int budgetYear, int budgetMonth);
}

package com.lmfinanz.budgets.adapter.out.persistence;

import com.lmfinanz.budgets.domain.model.MonthlyBudgetItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataBudgetRepository extends JpaRepository<MonthlyBudgetItem, UUID> {

    Optional<MonthlyBudgetItem> findByIdAndUserId(UUID id, UUID userId);

    List<MonthlyBudgetItem> findAllByUserIdAndBudgetYearAndBudgetMonthOrderByCountryCodeAscCurrencyCodeAscDueDayAscNameAsc(
            UUID userId,
            int budgetYear,
            int budgetMonth
    );
}

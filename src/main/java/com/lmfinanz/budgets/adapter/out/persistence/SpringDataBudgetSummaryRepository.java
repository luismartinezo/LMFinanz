package com.lmfinanz.budgets.adapter.out.persistence;

import com.lmfinanz.budgets.domain.model.MonthlyBudgetSummary;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataBudgetSummaryRepository extends JpaRepository<MonthlyBudgetSummary, UUID> {

    Optional<MonthlyBudgetSummary> findByUserIdAndBudgetYearAndBudgetMonthAndCountryCodeAndCurrencyCode(
            UUID userId,
            int budgetYear,
            int budgetMonth,
            String countryCode,
            String currencyCode
    );
}

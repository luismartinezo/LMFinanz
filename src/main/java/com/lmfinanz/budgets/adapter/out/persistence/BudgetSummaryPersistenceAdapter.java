package com.lmfinanz.budgets.adapter.out.persistence;

import com.lmfinanz.budgets.application.port.out.BudgetSummaryRepositoryPort;
import com.lmfinanz.budgets.domain.model.MonthlyBudgetSummary;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class BudgetSummaryPersistenceAdapter implements BudgetSummaryRepositoryPort {

    private final SpringDataBudgetSummaryRepository repository;

    public BudgetSummaryPersistenceAdapter(SpringDataBudgetSummaryRepository repository) {
        this.repository = repository;
    }

    @Override
    public MonthlyBudgetSummary save(MonthlyBudgetSummary summary) {
        return repository.save(summary);
    }

    @Override
    public Optional<MonthlyBudgetSummary> findByPeriod(UUID userId, int budgetYear, int budgetMonth, String countryCode, String currencyCode) {
        return repository.findByUserIdAndBudgetYearAndBudgetMonthAndCountryCodeAndCurrencyCode(
                userId,
                budgetYear,
                budgetMonth,
                countryCode,
                currencyCode
        );
    }
}

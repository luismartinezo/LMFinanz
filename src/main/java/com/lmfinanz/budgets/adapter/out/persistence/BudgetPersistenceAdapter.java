package com.lmfinanz.budgets.adapter.out.persistence;

import com.lmfinanz.budgets.application.port.out.BudgetRepositoryPort;
import com.lmfinanz.budgets.domain.model.MonthlyBudgetItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class BudgetPersistenceAdapter implements BudgetRepositoryPort {

    private final SpringDataBudgetRepository repository;

    public BudgetPersistenceAdapter(SpringDataBudgetRepository repository) {
        this.repository = repository;
    }

    @Override
    public MonthlyBudgetItem save(MonthlyBudgetItem item) {
        return repository.save(item);
    }

    @Override
    public Optional<MonthlyBudgetItem> findByIdAndUserId(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId);
    }

    @Override
    public List<MonthlyBudgetItem> findAllByPeriod(UUID userId, int budgetYear, int budgetMonth) {
        return repository.findAllByUserIdAndBudgetYearAndBudgetMonthOrderByCountryCodeAscCurrencyCodeAscDueDayAscNameAsc(
                userId,
                budgetYear,
                budgetMonth
        );
    }

    @Override
    public void delete(MonthlyBudgetItem item) {
        repository.delete(item);
    }
}

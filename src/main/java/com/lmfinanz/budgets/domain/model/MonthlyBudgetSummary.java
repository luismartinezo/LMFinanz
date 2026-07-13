package com.lmfinanz.budgets.domain.model;

import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "monthly_budget_summaries")
public class MonthlyBudgetSummary extends BaseEntity {

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private int budgetYear;

    @Column(nullable = false)
    private int budgetMonth;

    @Column(nullable = false, length = 2)
    private String countryCode;

    @Column(nullable = false, length = 3)
    private String currencyCode;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal incomeAmount = BigDecimal.ZERO;

    @Column(length = 500)
    private String notes;

    protected MonthlyBudgetSummary() {
    }

    public MonthlyBudgetSummary(UUID userId, int budgetYear, int budgetMonth, String countryCode, String currencyCode,
                                BigDecimal incomeAmount, String notes) {
        this.userId = userId;
        this.budgetYear = budgetYear;
        this.budgetMonth = budgetMonth;
        this.countryCode = countryCode;
        this.currencyCode = currencyCode;
        this.incomeAmount = incomeAmount == null ? BigDecimal.ZERO : incomeAmount;
        this.notes = notes;
        validatePeriod();
    }

    public UUID getUserId() {
        return userId;
    }

    public int getBudgetYear() {
        return budgetYear;
    }

    public int getBudgetMonth() {
        return budgetMonth;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public BigDecimal getIncomeAmount() {
        return incomeAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void update(BigDecimal incomeAmount, String notes) {
        this.incomeAmount = incomeAmount == null ? BigDecimal.ZERO : incomeAmount;
        this.notes = notes;
    }

    private void validatePeriod() {
        if (budgetMonth < 1 || budgetMonth > 12) {
            throw new DomainException("Budget month must be between 1 and 12");
        }
    }
}

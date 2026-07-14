package com.lmfinanz.budgets.domain.model;

import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "monthly_budget_items")
public class MonthlyBudgetItem extends BaseEntity {

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

    @Column(nullable = false, length = 140)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BudgetItemType itemType = BudgetItemType.EXPENSE;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal plannedAmount;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal actualAmount = BigDecimal.ZERO;

    private Integer dueDay;

    private LocalDate dueDate;

    @Column(nullable = false)
    private boolean paid;

    private LocalDate paidDate;

    @Column(length = 500)
    private String notes;

    protected MonthlyBudgetItem() {
    }

    public MonthlyBudgetItem(UUID userId, int budgetYear, int budgetMonth, String countryCode, String currencyCode,
                             String name, BudgetItemType itemType, BigDecimal plannedAmount, BigDecimal actualAmount,
                             Integer dueDay, LocalDate dueDate, boolean paid, LocalDate paidDate, String notes) {
        this.userId = userId;
        this.budgetYear = budgetYear;
        this.budgetMonth = budgetMonth;
        this.countryCode = countryCode;
        this.currencyCode = currencyCode;
        this.name = name;
        this.itemType = itemType == null ? BudgetItemType.EXPENSE : itemType;
        this.plannedAmount = plannedAmount;
        this.actualAmount = actualAmount == null ? BigDecimal.ZERO : actualAmount;
        this.dueDay = dueDay;
        this.dueDate = dueDate;
        this.paidDate = paidDate;
        this.notes = notes;
        validatePeriod();
        syncPaymentStatus(paid);
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

    public String getName() {
        return name;
    }

    public BudgetItemType getItemType() {
        return itemType;
    }

    public BigDecimal getPlannedAmount() {
        return plannedAmount;
    }

    public BigDecimal getActualAmount() {
        return actualAmount;
    }

    public Integer getDueDay() {
        return dueDay;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public boolean isPaid() {
        return paid;
    }

    public LocalDate getPaidDate() {
        return paidDate;
    }

    public String getNotes() {
        return notes;
    }

    public BigDecimal remainingAmount() {
        return plannedAmount.subtract(actualAmount);
    }

    public void update(int budgetYear, int budgetMonth, String countryCode, String currencyCode, String name,
                       BudgetItemType itemType, BigDecimal plannedAmount, BigDecimal actualAmount, Integer dueDay,
                       LocalDate dueDate, boolean paid, LocalDate paidDate, String notes) {
        this.budgetYear = budgetYear;
        this.budgetMonth = budgetMonth;
        this.countryCode = countryCode;
        this.currencyCode = currencyCode;
        this.name = name;
        this.itemType = itemType == null ? BudgetItemType.EXPENSE : itemType;
        this.plannedAmount = plannedAmount;
        this.actualAmount = actualAmount == null ? BigDecimal.ZERO : actualAmount;
        this.dueDay = dueDay;
        this.dueDate = dueDate;
        this.paidDate = paidDate;
        this.notes = notes;
        validatePeriod();
        syncPaymentStatus(paid);
    }

    public void markPaid(BigDecimal actualAmount, LocalDate paidDate) {
        this.actualAmount = actualAmount == null ? plannedAmount : actualAmount;
        this.paidDate = paidDate == null ? LocalDate.now() : paidDate;
        syncPaymentStatus(false);
    }

    public void markUnpaid() {
        this.paid = false;
        this.paidDate = null;
        this.actualAmount = BigDecimal.ZERO;
    }

    private void syncPaymentStatus(boolean requestedPaid) {
        paid = requestedPaid || actualAmount.compareTo(plannedAmount) >= 0;
        if (paid && paidDate == null) {
            paidDate = LocalDate.now();
        }
        if (actualAmount.compareTo(BigDecimal.ZERO) == 0 && !requestedPaid) {
            paidDate = null;
        }
    }

    private void validatePeriod() {
        if (budgetMonth < 1 || budgetMonth > 12) {
            throw new DomainException("Budget month must be between 1 and 12");
        }
        if (dueDay != null && (dueDay < 1 || dueDay > 31)) {
            throw new DomainException("Due day must be between 1 and 31");
        }
    }
}

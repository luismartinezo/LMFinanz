package com.lmfinanz.debts.domain.model;

import com.lmfinanz.shared.domain.model.BaseEntity;
import com.lmfinanz.shared.domain.exception.DomainException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "debts")
public class Debt extends BaseEntity {

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 140)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DebtType debtType;

    @Column(nullable = false, length = 3)
    private String currencyCode;

    @Column(nullable = false, length = 2)
    private String countryCode;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal principalAmount;

    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal annualInterestRate;

    @Column(nullable = false)
    private int installments;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate finalDueDate;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal remainingBalance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DebtStatus status = DebtStatus.ACTIVE;

    protected Debt() {
    }

    public Debt(UUID userId, String name, DebtType debtType, String currencyCode, String countryCode, BigDecimal principalAmount,
                BigDecimal annualInterestRate, int installments, LocalDate startDate, LocalDate finalDueDate) {
        this.userId = userId;
        this.name = name;
        this.debtType = debtType;
        this.currencyCode = currencyCode;
        this.countryCode = countryCode;
        this.principalAmount = principalAmount;
        this.annualInterestRate = annualInterestRate;
        this.installments = installments;
        this.startDate = startDate;
        this.finalDueDate = finalDueDate;
        this.remainingBalance = principalAmount;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public DebtType getDebtType() {
        return debtType;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public BigDecimal getPrincipalAmount() {
        return principalAmount;
    }

    public BigDecimal getAnnualInterestRate() {
        return annualInterestRate;
    }

    public int getInstallments() {
        return installments;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getFinalDueDate() {
        return finalDueDate;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public DebtStatus getStatus() {
        return status;
    }

    public void applyPrincipalPayment(BigDecimal principalPayment) {
        if (status != DebtStatus.ACTIVE) {
            throw new DomainException("Only active debts can receive payments");
        }
        BigDecimal updatedBalance = remainingBalance.subtract(principalPayment);
        if (updatedBalance.signum() < 0) {
            throw new DomainException("Debt payment exceeds remaining balance");
        }
        remainingBalance = updatedBalance;
        if (remainingBalance.signum() == 0) {
            status = DebtStatus.PAID;
        }
    }
}

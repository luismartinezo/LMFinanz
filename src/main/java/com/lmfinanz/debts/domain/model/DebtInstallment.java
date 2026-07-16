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
@Table(name = "debt_installments")
public class DebtInstallment extends BaseEntity {

    @Column(nullable = false)
    private UUID debtId;

    @Column(nullable = false)
    private int installmentNumber;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal principalAmount;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal interestAmount;

    @Column(nullable = false)
    private LocalDate dueDate;

    private LocalDate paidDate;

    @Column(precision = 19, scale = 4)
    private BigDecimal paidAmount;

    private UUID paymentTransactionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InstallmentStatus status = InstallmentStatus.PENDING;

    protected DebtInstallment() {
    }

    public DebtInstallment(UUID debtId, int installmentNumber, BigDecimal amount, BigDecimal principalAmount,
                           BigDecimal interestAmount, LocalDate dueDate) {
        this.debtId = debtId;
        this.installmentNumber = installmentNumber;
        this.amount = amount;
        this.principalAmount = principalAmount;
        this.interestAmount = interestAmount;
        this.dueDate = dueDate;
    }

    public UUID getDebtId() {
        return debtId;
    }

    public int getInstallmentNumber() {
        return installmentNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public BigDecimal getPrincipalAmount() {
        return principalAmount;
    }

    public BigDecimal getInterestAmount() {
        return interestAmount;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public LocalDate getPaidDate() {
        return paidDate;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public UUID getPaymentTransactionId() {
        return paymentTransactionId;
    }

    public InstallmentStatus getStatus() {
        return status;
    }

    public void markPaid(LocalDate paidDate, BigDecimal paidAmount, UUID paymentTransactionId) {
        if (status == InstallmentStatus.PAID) {
            throw new DomainException("Installment is already paid");
        }
        if (paidAmount == null || paidAmount.signum() <= 0) {
            throw new DomainException("Payment amount must be greater than zero");
        }
        this.paidDate = paidDate;
        this.paidAmount = paidAmount;
        this.paymentTransactionId = paymentTransactionId;
        this.status = InstallmentStatus.PAID;
    }

    public void markUnpaid() {
        if (status != InstallmentStatus.PAID) {
            throw new DomainException("Only paid installments can be marked as unpaid");
        }
        this.paidDate = null;
        this.paidAmount = null;
        this.paymentTransactionId = null;
        this.status = InstallmentStatus.PENDING;
    }

    public void updateDetails(BigDecimal amount, BigDecimal principalAmount, BigDecimal interestAmount, LocalDate dueDate) {
        if (status == InstallmentStatus.PAID) {
            throw new DomainException("Paid installments cannot be edited");
        }
        this.amount = amount;
        this.principalAmount = principalAmount;
        this.interestAmount = interestAmount;
        this.dueDate = dueDate;
    }
}

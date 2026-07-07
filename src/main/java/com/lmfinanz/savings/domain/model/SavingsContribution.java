package com.lmfinanz.savings.domain.model;

import com.lmfinanz.shared.domain.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "savings_contributions")
public class SavingsContribution extends BaseEntity {

    @Column(nullable = false)
    private UUID savingsGoalId;

    private UUID transactionId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate contributionDate;

    protected SavingsContribution() {
    }

    public SavingsContribution(UUID savingsGoalId, UUID transactionId, BigDecimal amount, LocalDate contributionDate) {
        this.savingsGoalId = savingsGoalId;
        this.transactionId = transactionId;
        this.amount = amount;
        this.contributionDate = contributionDate;
    }

    public UUID getSavingsGoalId() {
        return savingsGoalId;
    }

    public UUID getTransactionId() {
        return transactionId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getContributionDate() {
        return contributionDate;
    }
}

package com.lmfinanz.transactions.domain.model;

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
@Table(name = "transactions")
public class Transaction extends BaseEntity {

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    private UUID sourceAccountId;

    private UUID targetAccountId;

    private UUID categoryId;

    @Column(nullable = false, length = 3)
    private String currencyCode;

    @Column(nullable = false, length = 2)
    private String countryCode;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate transactionDate;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionStatus status = TransactionStatus.DRAFT;

    protected Transaction() {
    }

    public Transaction(UUID userId, TransactionType type, UUID sourceAccountId, UUID targetAccountId, UUID categoryId,
                       String currencyCode, String countryCode, BigDecimal amount, LocalDate transactionDate, String description) {
        this.userId = userId;
        this.type = type;
        this.sourceAccountId = sourceAccountId;
        this.targetAccountId = targetAccountId;
        this.categoryId = categoryId;
        this.currencyCode = currencyCode;
        this.countryCode = countryCode;
        this.amount = amount;
        this.transactionDate = transactionDate;
        this.description = description;
    }

    public UUID getUserId() {
        return userId;
    }

    public TransactionType getType() {
        return type;
    }

    public UUID getSourceAccountId() {
        return sourceAccountId;
    }

    public UUID getTargetAccountId() {
        return targetAccountId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public String getDescription() {
        return description;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void post() {
        status = TransactionStatus.POSTED;
    }
}

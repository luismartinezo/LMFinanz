package com.lmfinanz.accounts.domain.model;

import com.lmfinanz.shared.domain.model.BaseEntity;
import com.lmfinanz.shared.domain.exception.DomainException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "accounts")
public class Account extends BaseEntity {

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AccountType type;

    @Column(nullable = false, length = 3)
    private String currencyCode;

    @Column(nullable = false, length = 2)
    private String countryCode;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal openingBalance;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal currentBalance;

    @Column(nullable = false)
    private boolean active = true;

    protected Account() {
    }

    public Account(UUID userId, String name, AccountType type, String currencyCode, String countryCode, BigDecimal openingBalance) {
        this.userId = userId;
        this.name = name;
        this.type = type;
        this.currencyCode = currencyCode;
        this.countryCode = countryCode;
        this.openingBalance = openingBalance;
        this.currentBalance = openingBalance;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public AccountType getType() {
        return type;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public BigDecimal getOpeningBalance() {
        return openingBalance;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public boolean isActive() {
        return active;
    }

    public void rename(String name) {
        this.name = name;
    }

    public void close() {
        active = false;
    }

    public void reopen() {
        active = true;
    }

    public void credit(BigDecimal amount) {
        currentBalance = currentBalance.add(amount);
    }

    public void debit(BigDecimal amount) {
        BigDecimal newBalance = currentBalance.subtract(amount);
        if (newBalance.signum() < 0 && type != AccountType.CREDIT_CARD) {
            throw new DomainException("Insufficient account balance");
        }
        currentBalance = newBalance;
    }
}

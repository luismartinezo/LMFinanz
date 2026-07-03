package com.lmfinanz.shared.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

@Embeddable
public class Money {

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currencyCode;

    protected Money() {
    }

    public Money(BigDecimal amount, String currencyCode) {
        this.amount = amount;
        this.currencyCode = currencyCode;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }
}

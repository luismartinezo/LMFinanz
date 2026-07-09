package com.lmfinanz.reference.domain.model;

import com.lmfinanz.shared.domain.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "countries")
public class Country extends BaseEntity {

    @Column(nullable = false, unique = true, length = 2)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 3)
    private String defaultCurrencyCode;

    @Column(nullable = false)
    private boolean active = true;

    protected Country() {
    }

    public Country(String code, String name, String defaultCurrencyCode) {
        this.code = code;
        this.name = name;
        this.defaultCurrencyCode = defaultCurrencyCode;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDefaultCurrencyCode() {
        return defaultCurrencyCode;
    }

    public boolean isActive() {
        return active;
    }
}

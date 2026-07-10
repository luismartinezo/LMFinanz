package com.lmfinanz.assets.domain.model;

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
@Table(name = "assets")
public class Asset extends BaseEntity {

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 140)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AssetType type;

    @Column(nullable = false, length = 3)
    private String currencyCode;

    @Column(nullable = false, length = 2)
    private String countryCode;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal estimatedValue;

    private LocalDate acquisitionDate;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    protected Asset() {
    }

    public Asset(UUID userId, String name, AssetType type, String currencyCode, String countryCode,
                 BigDecimal estimatedValue, LocalDate acquisitionDate, String description) {
        this.userId = userId;
        this.name = name;
        this.type = type;
        this.currencyCode = currencyCode;
        this.countryCode = countryCode;
        this.estimatedValue = estimatedValue;
        this.acquisitionDate = acquisitionDate;
        this.description = description;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public AssetType getType() {
        return type;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public BigDecimal getEstimatedValue() {
        return estimatedValue;
    }

    public LocalDate getAcquisitionDate() {
        return acquisitionDate;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }

    public void update(String name, AssetType type, String currencyCode, String countryCode,
                       BigDecimal estimatedValue, LocalDate acquisitionDate, String description) {
        this.name = name;
        this.type = type;
        this.currencyCode = currencyCode;
        this.countryCode = countryCode;
        this.estimatedValue = estimatedValue;
        this.acquisitionDate = acquisitionDate;
        this.description = description;
    }

    public void retire() {
        active = false;
    }

    public void activate() {
        active = true;
    }
}

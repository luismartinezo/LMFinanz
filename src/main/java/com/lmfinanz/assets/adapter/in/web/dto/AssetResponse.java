package com.lmfinanz.assets.adapter.in.web.dto;

import com.lmfinanz.assets.domain.model.AssetType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AssetResponse(
        UUID id,
        String name,
        AssetType type,
        String currencyCode,
        String countryCode,
        BigDecimal estimatedValue,
        LocalDate acquisitionDate,
        String description,
        boolean active
) {
}

package com.lmfinanz.assets.adapter.in.web.dto;

import com.lmfinanz.assets.domain.model.AssetType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetRequest(
        @NotBlank @Size(max = 140) String name,
        @NotNull AssetType type,
        @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currencyCode,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
        @NotNull @DecimalMin(value = "0.0000") BigDecimal estimatedValue,
        @PastOrPresent LocalDate acquisitionDate,
        @Size(max = 500) String description
) {
}

package com.lmfinanz.assets.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.lmfinanz.assets.adapter.in.web.dto.AssetRequest;
import com.lmfinanz.assets.adapter.in.web.dto.AssetUpdateRequest;
import com.lmfinanz.assets.application.port.out.AssetRepositoryPort;
import com.lmfinanz.assets.domain.model.Asset;
import com.lmfinanz.assets.domain.model.AssetType;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Country;
import com.lmfinanz.reference.domain.model.Currency;
import com.lmfinanz.shared.domain.exception.DomainException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepositoryPort assetRepository;

    @Mock
    private ReferenceDataRepositoryPort referenceDataRepository;

    @Test
    void createsAssetForSupportedCountryAndCurrency() {
        AssetService service = new AssetService(assetRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("EUR"))
                .thenReturn(Optional.of(new Currency("EUR", "Euro", "EUR", 2)));
        when(referenceDataRepository.findCountryByCode("DE"))
                .thenReturn(Optional.of(new Country("DE", "Germany", "EUR")));
        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(UUID.randomUUID(), request("EUR", "DE", "  Primary vehicle  "));

        assertThat(response.name()).isEqualTo("Car");
        assertThat(response.type()).isEqualTo(AssetType.VEHICLE);
        assertThat(response.estimatedValue()).isEqualByComparingTo("12000.00");
        assertThat(response.description()).isEqualTo("Primary vehicle");
        assertThat(response.active()).isTrue();
    }

    @Test
    void rejectsUnsupportedCurrency() {
        AssetService service = new AssetService(assetRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("GBP")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), request("GBP", "DE", null)))
                .isInstanceOf(DomainException.class)
                .hasMessage("Unsupported currency: GBP");
    }

    @Test
    void rejectsUnsupportedCountry() {
        AssetService service = new AssetService(assetRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("EUR"))
                .thenReturn(Optional.of(new Currency("EUR", "Euro", "EUR", 2)));
        when(referenceDataRepository.findCountryByCode("BR")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), request("EUR", "BR", null)))
                .isInstanceOf(DomainException.class)
                .hasMessage("Unsupported country: BR");
    }

    @Test
    void updatesAssetDetails() {
        AssetService service = new AssetService(assetRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID assetId = UUID.randomUUID();
        Asset asset = new Asset(
                userId,
                "Car",
                AssetType.VEHICLE,
                "EUR",
                "DE",
                new BigDecimal("12000.00"),
                LocalDate.of(2025, 1, 10),
                "Primary vehicle"
        );
        when(referenceDataRepository.findCurrencyByCode("USD"))
                .thenReturn(Optional.of(new Currency("USD", "US Dollar", "USD", 2)));
        when(referenceDataRepository.findCountryByCode("CO"))
                .thenReturn(Optional.of(new Country("CO", "Colombia", "COP")));
        when(assetRepository.findByIdAndUserId(assetId, userId)).thenReturn(Optional.of(asset));
        when(assetRepository.save(asset)).thenReturn(asset);

        var response = service.update(userId, assetId, new AssetUpdateRequest(
                "Laptop",
                AssetType.ELECTRONICS,
                "USD",
                "CO",
                new BigDecimal("900.00"),
                LocalDate.of(2026, 1, 5),
                "  Work laptop  "
        ));

        assertThat(response.name()).isEqualTo("Laptop");
        assertThat(response.type()).isEqualTo(AssetType.ELECTRONICS);
        assertThat(response.currencyCode()).isEqualTo("USD");
        assertThat(response.countryCode()).isEqualTo("CO");
        assertThat(response.estimatedValue()).isEqualByComparingTo("900.00");
        assertThat(response.description()).isEqualTo("Work laptop");
    }

    @Test
    void retiresAndActivatesAsset() {
        AssetService service = new AssetService(assetRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID assetId = UUID.randomUUID();
        Asset asset = new Asset(
                userId,
                "Car",
                AssetType.VEHICLE,
                "EUR",
                "DE",
                new BigDecimal("12000.00"),
                LocalDate.of(2025, 1, 10),
                null
        );
        when(assetRepository.findByIdAndUserId(assetId, userId)).thenReturn(Optional.of(asset));
        when(assetRepository.save(asset)).thenReturn(asset);

        var retired = service.retire(userId, assetId);
        var activated = service.activate(userId, assetId);

        assertThat(retired.active()).isFalse();
        assertThat(activated.active()).isTrue();
    }

    private AssetRequest request(String currencyCode, String countryCode, String description) {
        return new AssetRequest(
                "Car",
                AssetType.VEHICLE,
                currencyCode,
                countryCode,
                new BigDecimal("12000.00"),
                LocalDate.of(2025, 1, 10),
                description
        );
    }
}

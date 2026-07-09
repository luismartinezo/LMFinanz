package com.lmfinanz.reference.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Country;
import com.lmfinanz.reference.domain.model.Currency;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReferenceDataServiceTest {

    @Mock
    private ReferenceDataRepositoryPort referenceDataRepository;

    @Test
    void returnsCurrenciesSortedByCode() {
        ReferenceDataService service = new ReferenceDataService(referenceDataRepository);
        when(referenceDataRepository.findAllCurrencies()).thenReturn(List.of(
                new Currency("USD", "US Dollar", "USD", 2),
                new Currency("EUR", "Euro", "EUR", 2),
                new Currency("COP", "Colombian Peso", "COP", 2)
        ));

        var response = service.currencies();

        assertThat(response).extracting("code").containsExactly("COP", "EUR", "USD");
    }

    @Test
    void returnsCountriesSortedByName() {
        ReferenceDataService service = new ReferenceDataService(referenceDataRepository);
        when(referenceDataRepository.findAllCountries()).thenReturn(List.of(
                new Country("DE", "Germany", "EUR"),
                new Country("CO", "Colombia", "COP")
        ));

        var response = service.countries();

        assertThat(response).extracting("code").containsExactly("CO", "DE");
        assertThat(response.get(0).defaultCurrencyCode()).isEqualTo("COP");
        assertThat(response.get(0).active()).isTrue();
    }
}

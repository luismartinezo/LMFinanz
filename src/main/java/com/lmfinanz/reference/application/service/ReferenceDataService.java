package com.lmfinanz.reference.application.service;

import com.lmfinanz.reference.adapter.in.web.dto.CountryResponse;
import com.lmfinanz.reference.adapter.in.web.dto.CurrencyResponse;
import com.lmfinanz.reference.application.port.in.ReferenceDataUseCase;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Country;
import com.lmfinanz.reference.domain.model.Currency;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReferenceDataService implements ReferenceDataUseCase {

    private final ReferenceDataRepositoryPort referenceDataRepository;

    public ReferenceDataService(ReferenceDataRepositoryPort referenceDataRepository) {
        this.referenceDataRepository = referenceDataRepository;
    }

    @Override
    public List<CurrencyResponse> currencies() {
        return referenceDataRepository.findAllCurrencies().stream()
                .sorted(Comparator.comparing(Currency::getCode))
                .map(currency -> new CurrencyResponse(
                        currency.getCode(),
                        currency.getName(),
                        currency.getSymbol(),
                        currency.getDecimalPlaces()
                ))
                .toList();
    }

    @Override
    public List<CountryResponse> countries() {
        return referenceDataRepository.findAllCountries().stream()
                .sorted(Comparator.comparing(Country::getName))
                .map(country -> new CountryResponse(
                        country.getCode(),
                        country.getName(),
                        country.getDefaultCurrencyCode(),
                        country.isActive()
                ))
                .toList();
    }
}

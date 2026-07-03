package com.lmfinanz.reference.adapter.out.persistence;

import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Country;
import com.lmfinanz.reference.domain.model.Currency;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class ReferenceDataPersistenceAdapter implements ReferenceDataRepositoryPort {

    private final SpringDataCurrencyRepository currencyRepository;
    private final SpringDataCountryRepository countryRepository;

    public ReferenceDataPersistenceAdapter(
            SpringDataCurrencyRepository currencyRepository,
            SpringDataCountryRepository countryRepository
    ) {
        this.currencyRepository = currencyRepository;
        this.countryRepository = countryRepository;
    }

    @Override
    public Optional<Currency> findCurrencyByCode(String code) {
        return currencyRepository.findByCode(code);
    }

    @Override
    public Optional<Country> findCountryByCode(String code) {
        return countryRepository.findByCode(code);
    }

    @Override
    public List<Currency> findAllCurrencies() {
        return currencyRepository.findAll();
    }

    @Override
    public List<Country> findAllCountries() {
        return countryRepository.findAll();
    }
}

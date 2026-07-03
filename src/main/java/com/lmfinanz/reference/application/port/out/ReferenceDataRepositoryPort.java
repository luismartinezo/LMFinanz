package com.lmfinanz.reference.application.port.out;

import com.lmfinanz.reference.domain.model.Country;
import com.lmfinanz.reference.domain.model.Currency;
import java.util.List;
import java.util.Optional;

public interface ReferenceDataRepositoryPort {

    Optional<Currency> findCurrencyByCode(String code);

    Optional<Country> findCountryByCode(String code);

    List<Currency> findAllCurrencies();

    List<Country> findAllCountries();
}

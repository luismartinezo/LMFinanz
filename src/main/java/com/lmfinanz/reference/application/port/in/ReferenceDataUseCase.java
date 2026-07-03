package com.lmfinanz.reference.application.port.in;

import com.lmfinanz.reference.adapter.in.web.dto.CountryResponse;
import com.lmfinanz.reference.adapter.in.web.dto.CurrencyResponse;
import java.util.List;

public interface ReferenceDataUseCase {

    List<CurrencyResponse> currencies();

    List<CountryResponse> countries();
}

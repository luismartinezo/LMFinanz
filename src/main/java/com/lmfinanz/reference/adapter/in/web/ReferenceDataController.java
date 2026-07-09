package com.lmfinanz.reference.adapter.in.web;

import com.lmfinanz.reference.adapter.in.web.dto.CountryResponse;
import com.lmfinanz.reference.adapter.in.web.dto.CurrencyResponse;
import com.lmfinanz.reference.application.port.in.ReferenceDataUseCase;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reference")
public class ReferenceDataController {

    private final ReferenceDataUseCase referenceDataUseCase;

    public ReferenceDataController(ReferenceDataUseCase referenceDataUseCase) {
        this.referenceDataUseCase = referenceDataUseCase;
    }

    @GetMapping("/currencies")
    public List<CurrencyResponse> currencies() {
        return referenceDataUseCase.currencies();
    }

    @GetMapping("/countries")
    public List<CountryResponse> countries() {
        return referenceDataUseCase.countries();
    }
}

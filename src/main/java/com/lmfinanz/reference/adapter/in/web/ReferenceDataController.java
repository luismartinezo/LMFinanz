package com.lmfinanz.reference.adapter.in.web;

import com.lmfinanz.reference.adapter.in.web.dto.CountryResponse;
import com.lmfinanz.reference.adapter.in.web.dto.CurrencyResponse;
import com.lmfinanz.reference.application.port.in.ReferenceDataUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reference")
@Tag(name = "Reference Data", description = "Public catalogs used by finance forms and filters")
public class ReferenceDataController {

    private final ReferenceDataUseCase referenceDataUseCase;

    public ReferenceDataController(ReferenceDataUseCase referenceDataUseCase) {
        this.referenceDataUseCase = referenceDataUseCase;
    }

    @GetMapping("/currencies")
    @Operation(summary = "List currencies", description = "Returns the supported currency catalog.")
    public List<CurrencyResponse> currencies() {
        return referenceDataUseCase.currencies();
    }

    @GetMapping("/countries")
    @Operation(summary = "List countries", description = "Returns the supported country catalog.")
    public List<CountryResponse> countries() {
        return referenceDataUseCase.countries();
    }
}

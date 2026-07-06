package com.lmfinanz.reports.application.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Country;
import com.lmfinanz.reference.domain.model.Currency;
import com.lmfinanz.reports.adapter.in.web.dto.ReportPeriod;
import com.lmfinanz.reports.application.port.out.ReportReadModelPort;
import com.lmfinanz.shared.domain.exception.DomainException;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ReportReadModelPort reportReadModel;

    @Mock
    private ReferenceDataRepositoryPort referenceDataRepository;

    @Test
    void delegatesSummaryWithProvidedDateRange() {
        ReportService service = new ReportService(reportReadModel, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 7, 1);
        LocalDate to = LocalDate.of(2026, 7, 31);

        service.summarize(userId, ReportPeriod.MONTHLY, from, to);

        verify(reportReadModel).summarize(userId, ReportPeriod.MONTHLY, from, to);
    }

    @Test
    void rejectsInvalidDateRange() {
        ReportService service = new ReportService(reportReadModel, referenceDataRepository);

        assertThatThrownBy(() -> service.summarize(
                UUID.randomUUID(),
                ReportPeriod.MONTHLY,
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 7, 1)
        ))
                .isInstanceOf(DomainException.class)
                .hasMessage("From date must be before or equal to to date");
    }

    @Test
    void validatesCurrencyBeforeDelegating() {
        ReportService service = new ReportService(reportReadModel, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 7, 1);
        LocalDate to = LocalDate.of(2026, 7, 31);
        when(referenceDataRepository.findCurrencyByCode("EUR"))
                .thenReturn(Optional.of(new Currency("EUR", "Euro", "EUR", 2)));

        service.summarizeByCurrency(userId, "EUR", from, to);

        verify(reportReadModel).summarizeByCurrency(userId, "EUR", from, to);
    }

    @Test
    void rejectsUnsupportedCountry() {
        ReportService service = new ReportService(reportReadModel, referenceDataRepository);
        when(referenceDataRepository.findCountryByCode("BR")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.summarizeByCountry(
                UUID.randomUUID(),
                "BR",
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 31)
        ))
                .isInstanceOf(DomainException.class)
                .hasMessage("Unsupported country: BR");
    }

    @Test
    void validatesCountryBeforeDelegating() {
        ReportService service = new ReportService(reportReadModel, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 7, 1);
        LocalDate to = LocalDate.of(2026, 7, 31);
        when(referenceDataRepository.findCountryByCode("DE"))
                .thenReturn(Optional.of(new Country("DE", "Germany", "EUR")));

        service.summarizeByCountry(userId, "DE", from, to);

        verify(reportReadModel).summarizeByCountry(userId, "DE", from, to);
    }
}

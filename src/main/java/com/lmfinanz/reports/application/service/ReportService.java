package com.lmfinanz.reports.application.service;

import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reports.adapter.in.web.dto.FinancialReportResponse;
import com.lmfinanz.reports.adapter.in.web.dto.ReportPeriod;
import com.lmfinanz.reports.application.port.in.ReportQueryUseCase;
import com.lmfinanz.reports.application.port.out.ReportReadModelPort;
import com.lmfinanz.shared.domain.exception.DomainException;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReportService implements ReportQueryUseCase {

    private final ReportReadModelPort reportReadModel;
    private final ReferenceDataRepositoryPort referenceDataRepository;

    public ReportService(
            ReportReadModelPort reportReadModel,
            ReferenceDataRepositoryPort referenceDataRepository
    ) {
        this.reportReadModel = reportReadModel;
        this.referenceDataRepository = referenceDataRepository;
    }

    @Override
    public FinancialReportResponse summarize(UUID userId, ReportPeriod period, LocalDate from, LocalDate to) {
        DateRange range = normalizeRange(from, to);
        return reportReadModel.summarize(userId, period, range.from(), range.to());
    }

    @Override
    public FinancialReportResponse summarizeByCurrency(UUID userId, String currencyCode, LocalDate from, LocalDate to) {
        DateRange range = normalizeRange(from, to);
        if (referenceDataRepository.findCurrencyByCode(currencyCode).isEmpty()) {
            throw new DomainException("Unsupported currency: " + currencyCode);
        }
        return reportReadModel.summarizeByCurrency(userId, currencyCode, range.from(), range.to());
    }

    @Override
    public FinancialReportResponse summarizeByCountry(UUID userId, String countryCode, LocalDate from, LocalDate to) {
        DateRange range = normalizeRange(from, to);
        if (referenceDataRepository.findCountryByCode(countryCode).isEmpty()) {
            throw new DomainException("Unsupported country: " + countryCode);
        }
        return reportReadModel.summarizeByCountry(userId, countryCode, range.from(), range.to());
    }

    private DateRange normalizeRange(LocalDate from, LocalDate to) {
        LocalDate effectiveTo = to == null ? LocalDate.now() : to;
        LocalDate effectiveFrom = from == null ? effectiveTo.withDayOfMonth(1) : from;
        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new DomainException("From date must be before or equal to to date");
        }
        return new DateRange(effectiveFrom, effectiveTo);
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }
}

package com.lmfinanz.reports.application.port.out;

import com.lmfinanz.reports.adapter.in.web.dto.FinancialReportResponse;
import com.lmfinanz.reports.adapter.in.web.dto.ReportPeriod;
import java.time.LocalDate;
import java.util.UUID;

public interface ReportReadModelPort {

    FinancialReportResponse summarize(UUID userId, ReportPeriod period, LocalDate from, LocalDate to);

    FinancialReportResponse summarizeByCurrency(UUID userId, String currencyCode, LocalDate from, LocalDate to);

    FinancialReportResponse summarizeByCountry(UUID userId, String countryCode, LocalDate from, LocalDate to);
}

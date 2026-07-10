package com.lmfinanz.reports.adapter.in.web;

import com.lmfinanz.reports.adapter.in.web.dto.FinancialReportResponse;
import com.lmfinanz.reports.adapter.in.web.dto.ReportPeriod;
import com.lmfinanz.reports.application.port.in.ReportQueryUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
@Tag(name = "Reports", description = "Financial summaries by period, currency, and country")
public class ReportController {

    private final ReportQueryUseCase reportQueryUseCase;

    public ReportController(ReportQueryUseCase reportQueryUseCase) {
        this.reportQueryUseCase = reportQueryUseCase;
    }

    @GetMapping("/summary")
    @Operation(summary = "Summary report", description = "Summarizes posted transactions for a date range and period.")
    public FinancialReportResponse summarize(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam(defaultValue = "MONTHLY") ReportPeriod period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportQueryUseCase.summarize(principal.userId(), period, from, to);
    }

    @GetMapping("/by-currency/{currencyCode}")
    @Operation(summary = "Report by currency", description = "Summarizes posted transactions filtered by currency.")
    public FinancialReportResponse summarizeByCurrency(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String currencyCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportQueryUseCase.summarizeByCurrency(principal.userId(), currencyCode, from, to);
    }

    @GetMapping("/by-country/{countryCode}")
    @Operation(summary = "Report by country", description = "Summarizes posted transactions filtered by country.")
    public FinancialReportResponse summarizeByCountry(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String countryCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportQueryUseCase.summarizeByCountry(principal.userId(), countryCode, from, to);
    }
}

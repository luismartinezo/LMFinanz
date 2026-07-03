package com.lmfinanz.reports.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FinancialReportResponse(
        ReportPeriod period,
        LocalDate from,
        LocalDate to,
        BigDecimal totalIncome,
        BigDecimal totalExpenses,
        BigDecimal netCashFlow,
        List<ReportBreakdownItem> breakdown
) {
}

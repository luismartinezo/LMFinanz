package com.lmfinanz.reports.adapter.in.web.dto;

import java.math.BigDecimal;

public record ReportBreakdownItem(
        String label,
        String currencyCode,
        String countryCode,
        BigDecimal amount
) {
}

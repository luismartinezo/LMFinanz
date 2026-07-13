package com.lmfinanz.budgets.application.port.in;

import com.lmfinanz.budgets.adapter.in.web.dto.BudgetSummaryRequest;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetSummaryResponse;
import java.util.UUID;

public interface BudgetSummaryUseCase {

    BudgetSummaryResponse get(UUID userId, int budgetYear, int budgetMonth, String countryCode, String currencyCode);

    BudgetSummaryResponse save(UUID userId, BudgetSummaryRequest request);
}

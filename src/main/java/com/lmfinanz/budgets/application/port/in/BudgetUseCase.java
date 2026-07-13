package com.lmfinanz.budgets.application.port.in;

import com.lmfinanz.budgets.adapter.in.web.dto.BudgetItemPaymentRequest;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetItemRequest;
import com.lmfinanz.budgets.adapter.in.web.dto.BudgetItemResponse;
import java.util.List;
import java.util.UUID;

public interface BudgetUseCase {

    BudgetItemResponse create(UUID userId, BudgetItemRequest request);

    List<BudgetItemResponse> list(UUID userId, int budgetYear, int budgetMonth, String countryCode, String currencyCode);

    BudgetItemResponse update(UUID userId, UUID itemId, BudgetItemRequest request);

    BudgetItemResponse markPaid(UUID userId, UUID itemId, BudgetItemPaymentRequest request);

    BudgetItemResponse markUnpaid(UUID userId, UUID itemId);
}

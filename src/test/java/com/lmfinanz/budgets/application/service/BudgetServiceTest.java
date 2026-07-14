package com.lmfinanz.budgets.application.service;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lmfinanz.budgets.application.port.out.BudgetRepositoryPort;
import com.lmfinanz.budgets.application.port.out.BudgetSummaryRepositoryPort;
import com.lmfinanz.budgets.domain.model.MonthlyBudgetItem;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepositoryPort budgetRepository;

    @Mock
    private BudgetSummaryRepositoryPort budgetSummaryRepository;

    @Mock
    private ReferenceDataRepositoryPort referenceDataRepository;

    @Test
    void deletesBudgetItemOwnedByUser() {
        BudgetService service = new BudgetService(budgetRepository, budgetSummaryRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        MonthlyBudgetItem item = new MonthlyBudgetItem(
                userId,
                2026,
                7,
                "DE",
                "EUR",
                "Rent",
                new BigDecimal("775.00"),
                BigDecimal.ZERO,
                1,
                LocalDate.of(2026, 7, 1),
                false,
                null,
                null
        );
        when(budgetRepository.findByIdAndUserId(itemId, userId)).thenReturn(Optional.of(item));

        service.delete(userId, itemId);

        verify(budgetRepository).delete(item);
    }
}

package com.lmfinanz.debts.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lmfinanz.debts.adapter.in.web.dto.DebtRequest;
import com.lmfinanz.debts.application.port.out.DebtRepositoryPort;
import com.lmfinanz.debts.domain.model.Debt;
import com.lmfinanz.debts.domain.model.DebtInstallment;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Currency;
import com.lmfinanz.shared.domain.exception.DomainException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DebtServiceTest {

    @Mock
    private DebtRepositoryPort debtRepository;

    @Mock
    private ReferenceDataRepositoryPort referenceDataRepository;

    @Test
    void createsDebtAndGeneratesInstallments() {
        DebtService service = new DebtService(debtRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("EUR"))
                .thenReturn(Optional.of(new Currency("EUR", "Euro", "EUR", 2)));
        when(debtRepository.save(any(Debt.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(debtRepository.saveInstallment(any(DebtInstallment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(UUID.randomUUID(), request(
                "Car loan",
                "1000.00",
                "12.00",
                2,
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 8, 1)
        ));

        assertThat(response.name()).isEqualTo("Car loan");
        assertThat(response.remainingBalance()).isEqualByComparingTo("1000.00");
        ArgumentCaptor<DebtInstallment> captor = ArgumentCaptor.forClass(DebtInstallment.class);
        verify(debtRepository, times(2)).saveInstallment(captor.capture());
        List<DebtInstallment> installments = captor.getAllValues();
        assertThat(installments).hasSize(2);
        assertThat(installments.get(0).getAmount()).isEqualByComparingTo("560.0000");
        assertThat(installments.get(1).getAmount()).isEqualByComparingTo("560.0000");
    }

    @Test
    void rejectsUnsupportedCurrency() {
        DebtService service = new DebtService(debtRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("GBP")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), request(
                "Loan",
                "1000.00",
                "5.00",
                3,
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 9, 1),
                "GBP"
        )))
                .isInstanceOf(DomainException.class)
                .hasMessage("Unsupported currency: GBP");
    }

    @Test
    void rejectsInstallmentsOutsideDebtPeriod() {
        DebtService service = new DebtService(debtRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("EUR"))
                .thenReturn(Optional.of(new Currency("EUR", "Euro", "EUR", 2)));

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), request(
                "Loan",
                "1000.00",
                "5.00",
                4,
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 9, 1)
        )))
                .isInstanceOf(DomainException.class)
                .hasMessage("Installments cannot exceed the number of months in the debt period");
    }

    private DebtRequest request(
            String name,
            String principalAmount,
            String annualInterestRate,
            int installments,
            LocalDate startDate,
            LocalDate finalDueDate
    ) {
        return request(name, principalAmount, annualInterestRate, installments, startDate, finalDueDate, "EUR");
    }

    private DebtRequest request(
            String name,
            String principalAmount,
            String annualInterestRate,
            int installments,
            LocalDate startDate,
            LocalDate finalDueDate,
            String currencyCode
    ) {
        return new DebtRequest(
                name,
                currencyCode,
                new BigDecimal(principalAmount),
                new BigDecimal(annualInterestRate),
                installments,
                startDate,
                finalDueDate
        );
    }
}

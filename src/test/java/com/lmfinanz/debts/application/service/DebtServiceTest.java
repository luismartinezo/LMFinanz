package com.lmfinanz.debts.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentPaymentRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtRequest;
import com.lmfinanz.debts.application.port.out.DebtRepositoryPort;
import com.lmfinanz.debts.domain.model.Debt;
import com.lmfinanz.debts.domain.model.DebtInstallment;
import com.lmfinanz.debts.domain.model.DebtStatus;
import com.lmfinanz.debts.domain.model.DebtType;
import com.lmfinanz.debts.domain.model.InstallmentStatus;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Country;
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
        when(referenceDataRepository.findCountryByCode("DE"))
                .thenReturn(Optional.of(new Country("DE", "Germany", "EUR")));
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
        assertThat(response.debtType()).isEqualTo(DebtType.PERSONAL_LOAN);
        assertThat(response.countryCode()).isEqualTo("DE");
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
        when(referenceDataRepository.findCountryByCode("DE"))
                .thenReturn(Optional.of(new Country("DE", "Germany", "EUR")));

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

    @Test
    void rejectsUnsupportedCountry() {
        DebtService service = new DebtService(debtRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("EUR"))
                .thenReturn(Optional.of(new Currency("EUR", "Euro", "EUR", 2)));
        when(referenceDataRepository.findCountryByCode("XX")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), request(
                "Loan",
                "1000.00",
                "5.00",
                3,
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 9, 1),
                "EUR",
                "XX"
        )))
                .isInstanceOf(DomainException.class)
                .hasMessage("Unsupported country: XX");
    }

    @Test
    void paysInstallmentAndReducesRemainingBalance() {
        DebtService service = new DebtService(debtRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID debtId = UUID.randomUUID();
        UUID installmentId = UUID.randomUUID();
        UUID paymentTransactionId = UUID.randomUUID();
        Debt debt = debt(userId, "1000.00", 2);
        DebtInstallment installment = installment(debtId, 1, "560.00", "500.00", "60.00");
        when(debtRepository.findByIdAndUserId(debtId, userId)).thenReturn(Optional.of(debt));
        when(debtRepository.findInstallmentByIdAndDebtId(installmentId, debt.getId()))
                .thenReturn(Optional.of(installment));
        when(debtRepository.save(debt)).thenReturn(debt);
        when(debtRepository.saveInstallment(installment)).thenReturn(installment);

        var response = service.payInstallment(
                userId,
                debtId,
                installmentId,
                new DebtInstallmentPaymentRequest(LocalDate.of(2026, 7, 10), paymentTransactionId)
        );

        assertThat(debt.getRemainingBalance()).isEqualByComparingTo("500.00");
        assertThat(debt.getStatus()).isEqualTo(DebtStatus.ACTIVE);
        assertThat(response.status()).isEqualTo(InstallmentStatus.PAID);
        assertThat(response.paidDate()).isEqualTo(LocalDate.of(2026, 7, 10));
        assertThat(response.paymentTransactionId()).isEqualTo(paymentTransactionId);
    }

    @Test
    void marksDebtPaidWhenLastPrincipalIsPaid() {
        DebtService service = new DebtService(debtRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID debtId = UUID.randomUUID();
        UUID installmentId = UUID.randomUUID();
        Debt debt = debt(userId, "500.00", 1);
        DebtInstallment installment = installment(debtId, 1, "560.00", "500.00", "60.00");
        when(debtRepository.findByIdAndUserId(debtId, userId)).thenReturn(Optional.of(debt));
        when(debtRepository.findInstallmentByIdAndDebtId(installmentId, debt.getId()))
                .thenReturn(Optional.of(installment));
        when(debtRepository.save(debt)).thenReturn(debt);
        when(debtRepository.saveInstallment(installment)).thenReturn(installment);

        service.payInstallment(userId, debtId, installmentId, new DebtInstallmentPaymentRequest(null, null));

        assertThat(debt.getRemainingBalance()).isEqualByComparingTo("0.00");
        assertThat(debt.getStatus()).isEqualTo(DebtStatus.PAID);
    }

    @Test
    void rejectsAlreadyPaidInstallment() {
        DebtService service = new DebtService(debtRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID debtId = UUID.randomUUID();
        UUID installmentId = UUID.randomUUID();
        Debt debt = debt(userId, "1000.00", 2);
        DebtInstallment installment = installment(debtId, 1, "560.00", "500.00", "60.00");
        installment.markPaid(LocalDate.of(2026, 7, 10), null);
        when(debtRepository.findByIdAndUserId(debtId, userId)).thenReturn(Optional.of(debt));
        when(debtRepository.findInstallmentByIdAndDebtId(installmentId, debt.getId()))
                .thenReturn(Optional.of(installment));

        assertThatThrownBy(() -> service.payInstallment(
                userId,
                debtId,
                installmentId,
                new DebtInstallmentPaymentRequest(LocalDate.of(2026, 7, 10), null)
        ))
                .isInstanceOf(DomainException.class)
                .hasMessage("Installment is already paid");
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
        return request(name, principalAmount, annualInterestRate, installments, startDate, finalDueDate, currencyCode, "DE");
    }

    private DebtRequest request(
            String name,
            String principalAmount,
            String annualInterestRate,
            int installments,
            LocalDate startDate,
            LocalDate finalDueDate,
            String currencyCode,
            String countryCode
    ) {
        return new DebtRequest(
                name,
                DebtType.PERSONAL_LOAN,
                currencyCode,
                countryCode,
                new BigDecimal(principalAmount),
                new BigDecimal(annualInterestRate),
                installments,
                startDate,
                finalDueDate
        );
    }

    private Debt debt(UUID userId, String principalAmount, int installments) {
        return new Debt(
                userId,
                "Loan",
                DebtType.PERSONAL_LOAN,
                "EUR",
                "DE",
                new BigDecimal(principalAmount),
                new BigDecimal("12.00"),
                installments,
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 8, 1)
        );
    }

    private DebtInstallment installment(
            UUID debtId,
            int installmentNumber,
            String amount,
            String principalAmount,
            String interestAmount
    ) {
        return new DebtInstallment(
                debtId,
                installmentNumber,
                new BigDecimal(amount),
                new BigDecimal(principalAmount),
                new BigDecimal(interestAmount),
                LocalDate.of(2026, 7, 1)
        );
    }
}

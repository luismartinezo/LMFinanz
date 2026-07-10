package com.lmfinanz.savings.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Currency;
import com.lmfinanz.savings.adapter.in.web.dto.SavingsContributionRequest;
import com.lmfinanz.savings.adapter.in.web.dto.SavingsGoalRequest;
import com.lmfinanz.savings.application.port.out.SavingsGoalRepositoryPort;
import com.lmfinanz.savings.domain.model.SavingsContribution;
import com.lmfinanz.savings.domain.model.SavingsGoal;
import com.lmfinanz.savings.domain.model.SavingsGoalStatus;
import com.lmfinanz.shared.domain.exception.DomainException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SavingsGoalServiceTest {

    @Mock
    private SavingsGoalRepositoryPort savingsGoalRepository;

    @Mock
    private ReferenceDataRepositoryPort referenceDataRepository;

    @Test
    void createsSavingsGoalForSupportedCurrency() {
        SavingsGoalService service = new SavingsGoalService(savingsGoalRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("EUR"))
                .thenReturn(Optional.of(new Currency("EUR", "Euro", "EUR", 2)));
        when(savingsGoalRepository.save(any(SavingsGoal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(UUID.randomUUID(), goalRequest());

        assertThat(response.name()).isEqualTo("Emergency fund");
        assertThat(response.currentAmount()).isEqualByComparingTo("0");
        assertThat(response.status()).isEqualTo(SavingsGoalStatus.ACTIVE);
    }

    @Test
    void rejectsUnsupportedCurrency() {
        SavingsGoalService service = new SavingsGoalService(savingsGoalRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("GBP")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), new SavingsGoalRequest(
                "Emergency fund",
                "GBP",
                new BigDecimal("1000.00"),
                LocalDate.now().plusMonths(6)
        )))
                .isInstanceOf(DomainException.class)
                .hasMessage("Unsupported currency: GBP");
    }

    @Test
    void contributesAndCompletesGoalWhenTargetIsReached() {
        SavingsGoalService service = new SavingsGoalService(savingsGoalRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID goalId = UUID.randomUUID();
        SavingsGoal goal = new SavingsGoal(
                userId,
                "Emergency fund",
                "EUR",
                new BigDecimal("1000.00"),
                LocalDate.now().plusMonths(6)
        );
        when(savingsGoalRepository.findByIdAndUserId(goalId, userId)).thenReturn(Optional.of(goal));
        when(savingsGoalRepository.save(goal)).thenReturn(goal);
        when(savingsGoalRepository.saveContribution(any(SavingsContribution.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.contribute(userId, goalId, new SavingsContributionRequest(
                null,
                new BigDecimal("1000.00"),
                LocalDate.now()
        ));

        assertThat(response.currentAmount()).isEqualByComparingTo("1000.00");
        assertThat(response.status()).isEqualTo(SavingsGoalStatus.COMPLETED);
        verify(savingsGoalRepository).saveContribution(any(SavingsContribution.class));
    }

    @Test
    void rejectsContributionToCompletedGoal() {
        SavingsGoalService service = new SavingsGoalService(savingsGoalRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID goalId = UUID.randomUUID();
        SavingsGoal goal = new SavingsGoal(
                userId,
                "Emergency fund",
                "EUR",
                new BigDecimal("1000.00"),
                LocalDate.now().plusMonths(6)
        );
        goal.contribute(new BigDecimal("1000.00"));
        when(savingsGoalRepository.findByIdAndUserId(goalId, userId)).thenReturn(Optional.of(goal));

        assertThatThrownBy(() -> service.contribute(userId, goalId, new SavingsContributionRequest(
                null,
                new BigDecimal("1.00"),
                LocalDate.now()
        )))
                .isInstanceOf(DomainException.class)
                .hasMessage("Only active savings goals can receive contributions");
    }

    @Test
    void cancelsActiveGoal() {
        SavingsGoalService service = new SavingsGoalService(savingsGoalRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID goalId = UUID.randomUUID();
        SavingsGoal goal = new SavingsGoal(
                userId,
                "Emergency fund",
                "EUR",
                new BigDecimal("1000.00"),
                LocalDate.now().plusMonths(6)
        );
        when(savingsGoalRepository.findByIdAndUserId(goalId, userId)).thenReturn(Optional.of(goal));
        when(savingsGoalRepository.save(goal)).thenReturn(goal);

        var response = service.cancel(userId, goalId);

        assertThat(response.status()).isEqualTo(SavingsGoalStatus.CANCELLED);
    }

    @Test
    void rejectsCancelCompletedGoal() {
        SavingsGoalService service = new SavingsGoalService(savingsGoalRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID goalId = UUID.randomUUID();
        SavingsGoal goal = new SavingsGoal(
                userId,
                "Emergency fund",
                "EUR",
                new BigDecimal("1000.00"),
                LocalDate.now().plusMonths(6)
        );
        goal.contribute(new BigDecimal("1000.00"));
        when(savingsGoalRepository.findByIdAndUserId(goalId, userId)).thenReturn(Optional.of(goal));

        assertThatThrownBy(() -> service.cancel(userId, goalId))
                .isInstanceOf(DomainException.class)
                .hasMessage("Only active savings goals can be cancelled");
    }

    private SavingsGoalRequest goalRequest() {
        return new SavingsGoalRequest(
                "Emergency fund",
                "EUR",
                new BigDecimal("1000.00"),
                LocalDate.now().plusMonths(6)
        );
    }
}

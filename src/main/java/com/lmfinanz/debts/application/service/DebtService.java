package com.lmfinanz.debts.application.service;

import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentResponse;
import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentPaymentRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtResponse;
import com.lmfinanz.debts.application.port.in.DebtUseCase;
import com.lmfinanz.debts.application.port.out.DebtRepositoryPort;
import com.lmfinanz.debts.domain.model.Debt;
import com.lmfinanz.debts.domain.model.DebtInstallment;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.exception.NotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DebtService implements DebtUseCase {

    private static final int MONEY_SCALE = 4;

    private final DebtRepositoryPort debtRepository;
    private final ReferenceDataRepositoryPort referenceDataRepository;

    public DebtService(
            DebtRepositoryPort debtRepository,
            ReferenceDataRepositoryPort referenceDataRepository
    ) {
        this.debtRepository = debtRepository;
        this.referenceDataRepository = referenceDataRepository;
    }

    @Override
    public DebtResponse create(UUID userId, DebtRequest request) {
        validateRequest(request);
        Debt debt = new Debt(
                userId,
                request.name().trim(),
                request.currencyCode(),
                request.principalAmount(),
                request.annualInterestRate(),
                request.installments(),
                request.startDate(),
                request.finalDueDate()
        );
        Debt savedDebt = debtRepository.save(debt);
        generateInstallments(savedDebt);
        return toResponse(savedDebt);
    }

    @Override
    @Transactional(readOnly = true)
    public DebtResponse get(UUID userId, UUID debtId) {
        return debtRepository.findByIdAndUserId(debtId, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Debt not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtResponse> list(UUID userId) {
        return debtRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtInstallmentResponse> listInstallments(UUID userId, UUID debtId) {
        Debt debt = debtRepository.findByIdAndUserId(debtId, userId)
                .orElseThrow(() -> new NotFoundException("Debt not found"));
        return debtRepository.findInstallmentsByDebtId(debt.getId()).stream()
                .map(this::toInstallmentResponse)
                .toList();
    }

    @Override
    public DebtInstallmentResponse payInstallment(
            UUID userId,
            UUID debtId,
            UUID installmentId,
            DebtInstallmentPaymentRequest request
    ) {
        Debt debt = debtRepository.findByIdAndUserId(debtId, userId)
                .orElseThrow(() -> new NotFoundException("Debt not found"));
        DebtInstallment installment = debtRepository.findInstallmentByIdAndDebtId(installmentId, debt.getId())
                .orElseThrow(() -> new NotFoundException("Debt installment not found"));

        LocalDate paidDate = request.paidDate() == null ? LocalDate.now() : request.paidDate();
        installment.markPaid(paidDate, request.paymentTransactionId());
        debt.applyPrincipalPayment(installment.getPrincipalAmount());

        debtRepository.save(debt);
        return toInstallmentResponse(debtRepository.saveInstallment(installment));
    }

    private void validateRequest(DebtRequest request) {
        if (referenceDataRepository.findCurrencyByCode(request.currencyCode()).isEmpty()) {
            throw new DomainException("Unsupported currency: " + request.currencyCode());
        }
        if (request.finalDueDate().isBefore(request.startDate())) {
            throw new DomainException("Final due date must be after or equal to start date");
        }
        long availableMonths = ChronoUnit.MONTHS.between(
                request.startDate().withDayOfMonth(1),
                request.finalDueDate().withDayOfMonth(1)
        ) + 1;
        if (request.installments() > availableMonths) {
            throw new DomainException("Installments cannot exceed the number of months in the debt period");
        }
    }

    private void generateInstallments(Debt debt) {
        BigDecimal principalPerInstallment = debt.getPrincipalAmount()
                .divide(BigDecimal.valueOf(debt.getInstallments()), MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal totalInterest = debt.getPrincipalAmount()
                .multiply(debt.getAnnualInterestRate())
                .divide(BigDecimal.valueOf(100), MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal interestPerInstallment = totalInterest
                .divide(BigDecimal.valueOf(debt.getInstallments()), MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal assignedPrincipal = BigDecimal.ZERO;
        BigDecimal assignedInterest = BigDecimal.ZERO;

        for (int number = 1; number <= debt.getInstallments(); number++) {
            boolean lastInstallment = number == debt.getInstallments();
            BigDecimal principalAmount = lastInstallment
                    ? debt.getPrincipalAmount().subtract(assignedPrincipal).setScale(MONEY_SCALE, RoundingMode.HALF_UP)
                    : principalPerInstallment;
            BigDecimal interestAmount = lastInstallment
                    ? totalInterest.subtract(assignedInterest).setScale(MONEY_SCALE, RoundingMode.HALF_UP)
                    : interestPerInstallment;
            BigDecimal amount = principalAmount.add(interestAmount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            debtRepository.saveInstallment(new DebtInstallment(
                    debt.getId(),
                    number,
                    amount,
                    principalAmount,
                    interestAmount,
                    dueDateFor(debt, number)
            ));

            assignedPrincipal = assignedPrincipal.add(principalAmount);
            assignedInterest = assignedInterest.add(interestAmount);
        }
    }

    private LocalDate dueDateFor(Debt debt, int installmentNumber) {
        LocalDate dueDate = debt.getStartDate().plusMonths(installmentNumber - 1);
        return dueDate.isAfter(debt.getFinalDueDate()) ? debt.getFinalDueDate() : dueDate;
    }

    private DebtResponse toResponse(Debt debt) {
        return new DebtResponse(
                debt.getId(),
                debt.getName(),
                debt.getCurrencyCode(),
                debt.getPrincipalAmount(),
                debt.getAnnualInterestRate(),
                debt.getInstallments(),
                debt.getStartDate(),
                debt.getFinalDueDate(),
                debt.getRemainingBalance(),
                debt.getStatus()
        );
    }

    private DebtInstallmentResponse toInstallmentResponse(DebtInstallment installment) {
        return new DebtInstallmentResponse(
                installment.getId(),
                installment.getDebtId(),
                installment.getInstallmentNumber(),
                installment.getAmount(),
                installment.getPrincipalAmount(),
                installment.getInterestAmount(),
                installment.getDueDate(),
                installment.getPaidDate(),
                installment.getPaymentTransactionId(),
                installment.getStatus()
        );
    }
}

package com.lmfinanz.debts.application.service;

import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentResponse;
import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentPaymentRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtResponse;
import com.lmfinanz.debts.application.port.in.DebtUseCase;
import com.lmfinanz.debts.application.port.out.DebtRepositoryPort;
import com.lmfinanz.debts.domain.model.Debt;
import com.lmfinanz.debts.domain.model.DebtInstallment;
import com.lmfinanz.debts.domain.model.DebtStatus;
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
                request.debtType(),
                request.currencyCode(),
                request.countryCode(),
                request.principalAmount(),
                request.annualInterestRate(),
                request.installmentAmount(),
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
    public DebtResponse update(UUID userId, UUID debtId, DebtRequest request) {
        validateRequest(request);
        Debt debt = findDebt(userId, debtId);
        if (debtRepository.existsPaidInstallmentByDebtId(debt.getId())) {
            throw new DomainException("Debts with paid installments cannot be recalculated. Edit pending installments instead.");
        }

        debtRepository.deleteInstallmentsByDebtId(debt.getId());
        debt.updateDetails(
                request.name().trim(),
                request.debtType(),
                request.currencyCode(),
                request.countryCode(),
                request.principalAmount(),
                request.annualInterestRate(),
                request.installmentAmount(),
                request.installments(),
                request.startDate(),
                request.finalDueDate()
        );
        Debt savedDebt = debtRepository.save(debt);
        generateInstallments(savedDebt);
        return toResponse(savedDebt);
    }

    @Override
    public void delete(UUID userId, UUID debtId) {
        Debt debt = findDebt(userId, debtId);
        if (debtRepository.existsPaidInstallmentByDebtId(debt.getId())) {
            throw new DomainException("Debts with paid installments cannot be deleted");
        }
        debtRepository.deleteInstallmentsByDebtId(debt.getId());
        debtRepository.delete(debt);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtResponse> list(UUID userId) {
        return debtRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<DebtInstallmentResponse> listInstallments(UUID userId, UUID debtId) {
        Debt debt = debtRepository.findByIdAndUserId(debtId, userId)
                .orElseThrow(() -> new NotFoundException("Debt not found"));
        List<DebtInstallment> installments = debtRepository.findInstallmentsByDebtId(debt.getId());
        if (installments.isEmpty() && debt.getStatus() == DebtStatus.ACTIVE) {
            generateInstallments(debt);
            installments = debtRepository.findInstallmentsByDebtId(debt.getId());
        }
        return installments.stream()
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
        Debt debt = findDebt(userId, debtId);
        DebtInstallment installment = findInstallment(installmentId, debt.getId());

        LocalDate paidDate = request.paidDate() == null ? LocalDate.now() : request.paidDate();
        installment.markPaid(paidDate, request.paymentAmount(), request.paymentTransactionId());
        debt.applyPrincipalPayment(request.paymentAmount());

        debtRepository.save(debt);
        return toInstallmentResponse(debtRepository.saveInstallment(installment));
    }

    @Override
    public DebtInstallmentResponse updateInstallment(
            UUID userId,
            UUID debtId,
            UUID installmentId,
            DebtInstallmentRequest request
    ) {
        Debt debt = findDebt(userId, debtId);
        DebtInstallment installment = findInstallment(installmentId, debt.getId());
        installment.updateDetails(
                request.amount(),
                request.principalAmount(),
                request.interestAmount(),
                request.dueDate()
        );
        return toInstallmentResponse(debtRepository.saveInstallment(installment));
    }

    @Override
    public DebtInstallmentResponse markInstallmentUnpaid(UUID userId, UUID debtId, UUID installmentId) {
        Debt debt = findDebt(userId, debtId);
        DebtInstallment installment = findInstallment(installmentId, debt.getId());
        BigDecimal paidAmount = installment.getPaidAmount() == null ? installment.getPrincipalAmount() : installment.getPaidAmount();
        installment.markUnpaid();
        debt.reversePrincipalPayment(paidAmount);
        debtRepository.save(debt);
        return toInstallmentResponse(debtRepository.saveInstallment(installment));
    }

    private Debt findDebt(UUID userId, UUID debtId) {
        return debtRepository.findByIdAndUserId(debtId, userId)
                .orElseThrow(() -> new NotFoundException("Debt not found"));
    }

    private DebtInstallment findInstallment(UUID installmentId, UUID debtId) {
        return debtRepository.findInstallmentByIdAndDebtId(installmentId, debtId)
                .orElseThrow(() -> new NotFoundException("Debt installment not found"));
    }

    private void validateRequest(DebtRequest request) {
        if (referenceDataRepository.findCurrencyByCode(request.currencyCode()).isEmpty()) {
            throw new DomainException("Unsupported currency: " + request.currencyCode());
        }
        if (referenceDataRepository.findCountryByCode(request.countryCode()).isEmpty()) {
            throw new DomainException("Unsupported country: " + request.countryCode());
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
        for (int number = 1; number <= debt.getInstallments(); number++) {
            BigDecimal amount = debt.getInstallmentAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            debtRepository.saveInstallment(new DebtInstallment(
                    debt.getId(),
                    number,
                    amount,
                    amount,
                    BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                    dueDateFor(debt, number)
            ));
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
                debt.getDebtType(),
                debt.getCurrencyCode(),
                debt.getCountryCode(),
                debt.getPrincipalAmount(),
                debt.getAnnualInterestRate(),
                debt.getInstallmentAmount(),
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
                installment.getPaidAmount(),
                installment.getPaymentTransactionId(),
                installment.getStatus()
        );
    }
}

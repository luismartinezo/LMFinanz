package com.lmfinanz.savings.application.service;

import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.savings.adapter.in.web.dto.SavingsContributionRequest;
import com.lmfinanz.savings.adapter.in.web.dto.SavingsGoalRequest;
import com.lmfinanz.savings.adapter.in.web.dto.SavingsGoalResponse;
import com.lmfinanz.savings.application.port.in.SavingsGoalUseCase;
import com.lmfinanz.savings.application.port.out.SavingsGoalRepositoryPort;
import com.lmfinanz.savings.domain.model.SavingsContribution;
import com.lmfinanz.savings.domain.model.SavingsGoal;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.exception.NotFoundException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SavingsGoalService implements SavingsGoalUseCase {

    private final SavingsGoalRepositoryPort savingsGoalRepository;
    private final ReferenceDataRepositoryPort referenceDataRepository;

    public SavingsGoalService(
            SavingsGoalRepositoryPort savingsGoalRepository,
            ReferenceDataRepositoryPort referenceDataRepository
    ) {
        this.savingsGoalRepository = savingsGoalRepository;
        this.referenceDataRepository = referenceDataRepository;
    }

    @Override
    public SavingsGoalResponse create(UUID userId, SavingsGoalRequest request) {
        validateCurrency(request.currencyCode());
        SavingsGoal goal = new SavingsGoal(
                userId,
                request.name().trim(),
                request.currencyCode(),
                request.targetAmount(),
                request.deadline()
        );
        return toResponse(savingsGoalRepository.save(goal));
    }

    @Override
    public SavingsGoalResponse contribute(UUID userId, UUID goalId, SavingsContributionRequest request) {
        SavingsGoal goal = savingsGoalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new NotFoundException("Savings goal not found"));
        goal.contribute(request.amount());
        savingsGoalRepository.saveContribution(new SavingsContribution(
                goal.getId(),
                request.transactionId(),
                request.amount(),
                request.contributionDate()
        ));
        return toResponse(savingsGoalRepository.save(goal));
    }

    @Override
    @Transactional(readOnly = true)
    public SavingsGoalResponse get(UUID userId, UUID goalId) {
        return savingsGoalRepository.findByIdAndUserId(goalId, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Savings goal not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SavingsGoalResponse> list(UUID userId) {
        return savingsGoalRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateCurrency(String currencyCode) {
        if (referenceDataRepository.findCurrencyByCode(currencyCode).isEmpty()) {
            throw new DomainException("Unsupported currency: " + currencyCode);
        }
    }

    private SavingsGoalResponse toResponse(SavingsGoal goal) {
        return new SavingsGoalResponse(
                goal.getId(),
                goal.getName(),
                goal.getCurrencyCode(),
                goal.getTargetAmount(),
                goal.getCurrentAmount(),
                goal.getDeadline(),
                goal.getStatus()
        );
    }
}

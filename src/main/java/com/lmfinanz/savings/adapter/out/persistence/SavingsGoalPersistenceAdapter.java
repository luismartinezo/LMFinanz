package com.lmfinanz.savings.adapter.out.persistence;

import com.lmfinanz.savings.application.port.out.SavingsGoalRepositoryPort;
import com.lmfinanz.savings.domain.model.SavingsContribution;
import com.lmfinanz.savings.domain.model.SavingsGoal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class SavingsGoalPersistenceAdapter implements SavingsGoalRepositoryPort {

    private final SpringDataSavingsGoalRepository goalRepository;
    private final SpringDataSavingsContributionRepository contributionRepository;

    public SavingsGoalPersistenceAdapter(
            SpringDataSavingsGoalRepository goalRepository,
            SpringDataSavingsContributionRepository contributionRepository
    ) {
        this.goalRepository = goalRepository;
        this.contributionRepository = contributionRepository;
    }

    @Override
    public SavingsGoal save(SavingsGoal goal) {
        return goalRepository.save(goal);
    }

    @Override
    public SavingsContribution saveContribution(SavingsContribution contribution) {
        return contributionRepository.save(contribution);
    }

    @Override
    public Optional<SavingsGoal> findByIdAndUserId(UUID id, UUID userId) {
        return goalRepository.findByIdAndUserId(id, userId);
    }

    @Override
    public List<SavingsGoal> findAllByUserId(UUID userId) {
        return goalRepository.findAllByUserIdOrderByDeadlineAscNameAsc(userId);
    }
}

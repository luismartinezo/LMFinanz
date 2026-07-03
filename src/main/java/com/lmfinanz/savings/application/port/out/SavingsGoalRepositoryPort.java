package com.lmfinanz.savings.application.port.out;

import com.lmfinanz.savings.domain.model.SavingsContribution;
import com.lmfinanz.savings.domain.model.SavingsGoal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavingsGoalRepositoryPort {

    SavingsGoal save(SavingsGoal goal);

    SavingsContribution saveContribution(SavingsContribution contribution);

    Optional<SavingsGoal> findByIdAndUserId(UUID id, UUID userId);

    List<SavingsGoal> findAllByUserId(UUID userId);
}

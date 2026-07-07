package com.lmfinanz.savings.adapter.out.persistence;

import com.lmfinanz.savings.domain.model.SavingsGoal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataSavingsGoalRepository extends JpaRepository<SavingsGoal, UUID> {

    Optional<SavingsGoal> findByIdAndUserId(UUID id, UUID userId);

    List<SavingsGoal> findAllByUserIdOrderByDeadlineAscNameAsc(UUID userId);
}

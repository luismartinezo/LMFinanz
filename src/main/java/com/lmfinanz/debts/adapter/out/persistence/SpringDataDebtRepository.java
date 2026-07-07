package com.lmfinanz.debts.adapter.out.persistence;

import com.lmfinanz.debts.domain.model.Debt;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataDebtRepository extends JpaRepository<Debt, UUID> {

    Optional<Debt> findByIdAndUserId(UUID id, UUID userId);

    List<Debt> findAllByUserIdOrderByFinalDueDateAscNameAsc(UUID userId);
}

package com.lmfinanz.debts.adapter.out.persistence;

import com.lmfinanz.debts.domain.model.DebtInstallment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataDebtInstallmentRepository extends JpaRepository<DebtInstallment, UUID> {

    List<DebtInstallment> findAllByDebtIdOrderByInstallmentNumberAsc(UUID debtId);

    Optional<DebtInstallment> findByIdAndDebtId(UUID id, UUID debtId);

    boolean existsByDebtIdAndStatus(UUID debtId, com.lmfinanz.debts.domain.model.InstallmentStatus status);

    void deleteAllByDebtId(UUID debtId);
}

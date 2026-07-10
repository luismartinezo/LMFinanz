package com.lmfinanz.debts.application.port.out;

import com.lmfinanz.debts.domain.model.Debt;
import com.lmfinanz.debts.domain.model.DebtInstallment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DebtRepositoryPort {

    Debt save(Debt debt);

    DebtInstallment saveInstallment(DebtInstallment installment);

    Optional<Debt> findByIdAndUserId(UUID id, UUID userId);

    List<Debt> findAllByUserId(UUID userId);

    List<DebtInstallment> findInstallmentsByDebtId(UUID debtId);

    Optional<DebtInstallment> findInstallmentByIdAndDebtId(UUID installmentId, UUID debtId);
}

package com.lmfinanz.debts.adapter.out.persistence;

import com.lmfinanz.debts.application.port.out.DebtRepositoryPort;
import com.lmfinanz.debts.domain.model.Debt;
import com.lmfinanz.debts.domain.model.DebtInstallment;
import com.lmfinanz.debts.domain.model.InstallmentStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class DebtPersistenceAdapter implements DebtRepositoryPort {

    private final SpringDataDebtRepository debtRepository;
    private final SpringDataDebtInstallmentRepository installmentRepository;

    public DebtPersistenceAdapter(
            SpringDataDebtRepository debtRepository,
            SpringDataDebtInstallmentRepository installmentRepository
    ) {
        this.debtRepository = debtRepository;
        this.installmentRepository = installmentRepository;
    }

    @Override
    public Debt save(Debt debt) {
        return debtRepository.save(debt);
    }

    @Override
    public void delete(Debt debt) {
        debtRepository.delete(debt);
    }

    @Override
    public DebtInstallment saveInstallment(DebtInstallment installment) {
        return installmentRepository.save(installment);
    }

    @Override
    public void deleteInstallmentsByDebtId(UUID debtId) {
        installmentRepository.deleteAllByDebtId(debtId);
    }

    @Override
    public Optional<Debt> findByIdAndUserId(UUID id, UUID userId) {
        return debtRepository.findByIdAndUserId(id, userId);
    }

    @Override
    public List<Debt> findAllByUserId(UUID userId) {
        return debtRepository.findAllByUserIdOrderByFinalDueDateAscNameAsc(userId);
    }

    @Override
    public List<DebtInstallment> findInstallmentsByDebtId(UUID debtId) {
        return installmentRepository.findAllByDebtIdOrderByInstallmentNumberAsc(debtId);
    }

    @Override
    public Optional<DebtInstallment> findInstallmentByIdAndDebtId(UUID installmentId, UUID debtId) {
        return installmentRepository.findByIdAndDebtId(installmentId, debtId);
    }

    @Override
    public boolean existsPaidInstallmentByDebtId(UUID debtId) {
        return installmentRepository.existsByDebtIdAndStatus(debtId, InstallmentStatus.PAID);
    }
}

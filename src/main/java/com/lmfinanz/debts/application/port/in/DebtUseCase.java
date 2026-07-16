package com.lmfinanz.debts.application.port.in;

import com.lmfinanz.debts.adapter.in.web.dto.DebtRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentResponse;
import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentPaymentRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtResponse;
import java.util.List;
import java.util.UUID;

public interface DebtUseCase {

    DebtResponse create(UUID userId, DebtRequest request);

    DebtResponse get(UUID userId, UUID debtId);

    DebtResponse update(UUID userId, UUID debtId, DebtRequest request);

    void delete(UUID userId, UUID debtId);

    List<DebtResponse> list(UUID userId);

    List<DebtInstallmentResponse> listInstallments(UUID userId, UUID debtId);

    DebtInstallmentResponse payInstallment(
            UUID userId,
            UUID debtId,
            UUID installmentId,
            DebtInstallmentPaymentRequest request
    );

    DebtInstallmentResponse updateInstallment(
            UUID userId,
            UUID debtId,
            UUID installmentId,
            DebtInstallmentRequest request
    );

    DebtInstallmentResponse markInstallmentUnpaid(UUID userId, UUID debtId, UUID installmentId);
}

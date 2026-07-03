package com.lmfinanz.debts.application.port.in;

import com.lmfinanz.debts.adapter.in.web.dto.DebtRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtResponse;
import java.util.List;
import java.util.UUID;

public interface DebtUseCase {

    DebtResponse create(UUID userId, DebtRequest request);

    DebtResponse get(UUID userId, UUID debtId);

    List<DebtResponse> list(UUID userId);
}

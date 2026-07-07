package com.lmfinanz.savings.application.port.in;

import com.lmfinanz.savings.adapter.in.web.dto.SavingsContributionRequest;
import com.lmfinanz.savings.adapter.in.web.dto.SavingsGoalRequest;
import com.lmfinanz.savings.adapter.in.web.dto.SavingsGoalResponse;
import java.util.List;
import java.util.UUID;

public interface SavingsGoalUseCase {

    SavingsGoalResponse create(UUID userId, SavingsGoalRequest request);

    SavingsGoalResponse contribute(UUID userId, UUID goalId, SavingsContributionRequest request);

    SavingsGoalResponse get(UUID userId, UUID goalId);

    List<SavingsGoalResponse> list(UUID userId);
}

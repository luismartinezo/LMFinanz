package com.lmfinanz.savings.adapter.in.web;

import com.lmfinanz.savings.adapter.in.web.dto.SavingsContributionRequest;
import com.lmfinanz.savings.adapter.in.web.dto.SavingsGoalRequest;
import com.lmfinanz.savings.adapter.in.web.dto.SavingsGoalResponse;
import com.lmfinanz.savings.application.port.in.SavingsGoalUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/savings-goals")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
@Tag(name = "Savings Goals", description = "Savings targets, contributions, and cancellation")
public class SavingsGoalController {

    private final SavingsGoalUseCase savingsGoalUseCase;

    public SavingsGoalController(SavingsGoalUseCase savingsGoalUseCase) {
        this.savingsGoalUseCase = savingsGoalUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create savings goal", description = "Creates a savings goal for the authenticated user.")
    public SavingsGoalResponse create(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody SavingsGoalRequest request
    ) {
        return savingsGoalUseCase.create(principal.userId(), request);
    }

    @PostMapping("/{goalId}/contributions")
    @Operation(summary = "Add savings contribution", description = "Adds a contribution and completes the goal when the target is reached.")
    public SavingsGoalResponse contribute(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID goalId,
            @Valid @RequestBody SavingsContributionRequest request
    ) {
        return savingsGoalUseCase.contribute(principal.userId(), goalId, request);
    }

    @PostMapping("/{goalId}/cancel")
    @Operation(summary = "Cancel savings goal", description = "Cancels an active savings goal.")
    public SavingsGoalResponse cancel(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID goalId
    ) {
        return savingsGoalUseCase.cancel(principal.userId(), goalId);
    }

    @GetMapping("/{goalId}")
    @Operation(summary = "Get savings goal", description = "Returns one savings goal owned by the authenticated user.")
    public SavingsGoalResponse get(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID goalId
    ) {
        return savingsGoalUseCase.get(principal.userId(), goalId);
    }

    @GetMapping
    @Operation(summary = "List savings goals", description = "Lists savings goals owned by the authenticated user.")
    public List<SavingsGoalResponse> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return savingsGoalUseCase.list(principal.userId());
    }
}

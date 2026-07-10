package com.lmfinanz.debts.adapter.in.web;

import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentResponse;
import com.lmfinanz.debts.adapter.in.web.dto.DebtInstallmentPaymentRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtRequest;
import com.lmfinanz.debts.adapter.in.web.dto.DebtResponse;
import com.lmfinanz.debts.application.port.in.DebtUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
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
@RequestMapping("/api/debts")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class DebtController {

    private final DebtUseCase debtUseCase;

    public DebtController(DebtUseCase debtUseCase) {
        this.debtUseCase = debtUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DebtResponse create(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody DebtRequest request
    ) {
        return debtUseCase.create(principal.userId(), request);
    }

    @GetMapping("/{debtId}")
    public DebtResponse get(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID debtId
    ) {
        return debtUseCase.get(principal.userId(), debtId);
    }

    @GetMapping
    public List<DebtResponse> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return debtUseCase.list(principal.userId());
    }

    @GetMapping("/{debtId}/installments")
    public List<DebtInstallmentResponse> listInstallments(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID debtId
    ) {
        return debtUseCase.listInstallments(principal.userId(), debtId);
    }

    @PostMapping("/{debtId}/installments/{installmentId}/pay")
    public DebtInstallmentResponse payInstallment(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID debtId,
            @PathVariable UUID installmentId,
            @Valid @RequestBody DebtInstallmentPaymentRequest request
    ) {
        return debtUseCase.payInstallment(principal.userId(), debtId, installmentId, request);
    }
}

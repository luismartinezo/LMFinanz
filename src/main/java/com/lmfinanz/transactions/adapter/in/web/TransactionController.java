package com.lmfinanz.transactions.adapter.in.web;

import com.lmfinanz.shared.security.JwtPrincipal;
import com.lmfinanz.transactions.adapter.in.web.dto.TransactionRequest;
import com.lmfinanz.transactions.adapter.in.web.dto.TransactionResponse;
import com.lmfinanz.transactions.application.port.in.TransactionUseCase;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class TransactionController {

    private final TransactionUseCase transactionUseCase;

    public TransactionController(TransactionUseCase transactionUseCase) {
        this.transactionUseCase = transactionUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody TransactionRequest request
    ) {
        return transactionUseCase.create(principal.userId(), request);
    }

    @PostMapping("/{transactionId}/post")
    public TransactionResponse post(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID transactionId
    ) {
        return transactionUseCase.post(principal.userId(), transactionId);
    }

    @PostMapping("/{transactionId}/cancel")
    public TransactionResponse cancel(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID transactionId
    ) {
        return transactionUseCase.cancel(principal.userId(), transactionId);
    }

    @GetMapping
    public List<TransactionResponse> list(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return transactionUseCase.list(principal.userId(), from, to);
    }
}

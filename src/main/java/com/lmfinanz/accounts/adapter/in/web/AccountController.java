package com.lmfinanz.accounts.adapter.in.web;

import com.lmfinanz.accounts.adapter.in.web.dto.AccountRequest;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountResponse;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountUpdateRequest;
import com.lmfinanz.accounts.application.port.in.AccountUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class AccountController {

    private final AccountUseCase accountUseCase;

    public AccountController(AccountUseCase accountUseCase) {
        this.accountUseCase = accountUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody AccountRequest request
    ) {
        return accountUseCase.create(principal.userId(), request);
    }

    @GetMapping("/{accountId}")
    public AccountResponse get(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID accountId
    ) {
        return accountUseCase.get(principal.userId(), accountId);
    }

    @GetMapping
    public List<AccountResponse> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return accountUseCase.list(principal.userId());
    }

    @PutMapping("/{accountId}")
    public AccountResponse update(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID accountId,
            @Valid @RequestBody AccountUpdateRequest request
    ) {
        return accountUseCase.update(principal.userId(), accountId, request);
    }

    @PatchMapping("/{accountId}/close")
    public AccountResponse close(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID accountId
    ) {
        return accountUseCase.close(principal.userId(), accountId);
    }

    @PatchMapping("/{accountId}/reopen")
    public AccountResponse reopen(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID accountId
    ) {
        return accountUseCase.reopen(principal.userId(), accountId);
    }
}

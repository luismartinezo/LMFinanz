package com.lmfinanz.accounts.adapter.in.web;

import com.lmfinanz.accounts.adapter.in.web.dto.AccountRequest;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountResponse;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountUpdateRequest;
import com.lmfinanz.accounts.application.port.in.AccountUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@Tag(name = "Accounts", description = "Bank accounts, cash accounts, and credit cards")
public class AccountController {

    private final AccountUseCase accountUseCase;

    public AccountController(AccountUseCase accountUseCase) {
        this.accountUseCase = accountUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create account", description = "Creates a bank, cash, or credit-card account for the authenticated user.")
    public AccountResponse create(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody AccountRequest request
    ) {
        return accountUseCase.create(principal.userId(), request);
    }

    @GetMapping("/{accountId}")
    @Operation(summary = "Get account", description = "Returns one account owned by the authenticated user.")
    public AccountResponse get(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID accountId
    ) {
        return accountUseCase.get(principal.userId(), accountId);
    }

    @GetMapping
    @Operation(summary = "List accounts", description = "Lists accounts owned by the authenticated user.")
    public List<AccountResponse> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return accountUseCase.list(principal.userId());
    }

    @PutMapping("/{accountId}")
    @Operation(summary = "Update account", description = "Updates mutable account data such as the account name.")
    public AccountResponse update(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID accountId,
            @Valid @RequestBody AccountUpdateRequest request
    ) {
        return accountUseCase.update(principal.userId(), accountId, request);
    }

    @PatchMapping("/{accountId}/close")
    @Operation(summary = "Close account", description = "Closes an account without deleting its financial history.")
    public AccountResponse close(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID accountId
    ) {
        return accountUseCase.close(principal.userId(), accountId);
    }

    @PatchMapping("/{accountId}/reopen")
    @Operation(summary = "Reopen account", description = "Reopens a previously closed account.")
    public AccountResponse reopen(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID accountId
    ) {
        return accountUseCase.reopen(principal.userId(), accountId);
    }

    @DeleteMapping("/{accountId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete account", description = "Deletes an account only when it has no transaction history.")
    public void delete(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID accountId
    ) {
        accountUseCase.delete(principal.userId(), accountId);
    }
}

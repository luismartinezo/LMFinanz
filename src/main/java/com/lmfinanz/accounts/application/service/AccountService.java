package com.lmfinanz.accounts.application.service;

import com.lmfinanz.accounts.adapter.in.web.dto.AccountRequest;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountResponse;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountUpdateRequest;
import com.lmfinanz.accounts.application.port.in.AccountUseCase;
import com.lmfinanz.accounts.application.port.out.AccountRepositoryPort;
import com.lmfinanz.accounts.domain.model.Account;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.exception.NotFoundException;
import com.lmfinanz.transactions.application.port.out.TransactionRepositoryPort;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AccountService implements AccountUseCase {

    private final AccountRepositoryPort accountRepository;
    private final ReferenceDataRepositoryPort referenceDataRepository;
    private final TransactionRepositoryPort transactionRepository;

    public AccountService(
            AccountRepositoryPort accountRepository,
            ReferenceDataRepositoryPort referenceDataRepository,
            TransactionRepositoryPort transactionRepository
    ) {
        this.accountRepository = accountRepository;
        this.referenceDataRepository = referenceDataRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public AccountResponse create(UUID userId, AccountRequest request) {
        validateReferenceData(request.currencyCode(), request.countryCode());
        Account account = new Account(
                userId,
                request.name().trim(),
                request.type(),
                request.currencyCode(),
                request.countryCode(),
                request.openingBalance()
        );
        return toResponse(accountRepository.save(account));
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse get(UUID userId, UUID accountId) {
        return accountRepository.findByIdAndUserId(accountId, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Account not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> list(UUID userId) {
        return accountRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AccountResponse update(UUID userId, UUID accountId, AccountUpdateRequest request) {
        Account account = findAccount(userId, accountId);
        account.updateDetails(request.name().trim(), request.type(), request.currentBalance());
        return toResponse(accountRepository.save(account));
    }

    @Override
    public AccountResponse close(UUID userId, UUID accountId) {
        Account account = findAccount(userId, accountId);
        account.close();
        return toResponse(accountRepository.save(account));
    }

    @Override
    public AccountResponse reopen(UUID userId, UUID accountId) {
        Account account = findAccount(userId, accountId);
        account.reopen();
        return toResponse(accountRepository.save(account));
    }

    @Override
    public void delete(UUID userId, UUID accountId) {
        Account account = findAccount(userId, accountId);
        if (transactionRepository.existsByUserIdAndAccountId(userId, accountId)) {
            throw new DomainException("Accounts with transactions cannot be deleted. Close the account instead.");
        }
        accountRepository.delete(account);
    }

    private void validateReferenceData(String currencyCode, String countryCode) {
        if (referenceDataRepository.findCurrencyByCode(currencyCode).isEmpty()) {
            throw new DomainException("Unsupported currency: " + currencyCode);
        }
        if (referenceDataRepository.findCountryByCode(countryCode).isEmpty()) {
            throw new DomainException("Unsupported country: " + countryCode);
        }
    }

    private Account findAccount(UUID userId, UUID accountId) {
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new NotFoundException("Account not found"));
    }

    private AccountResponse toResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getName(),
                account.getType(),
                account.getCurrencyCode(),
                account.getCountryCode(),
                account.getCurrentBalance(),
                account.isActive()
        );
    }
}

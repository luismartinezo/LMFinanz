package com.lmfinanz.transactions.application.service;

import com.lmfinanz.accounts.application.port.out.AccountRepositoryPort;
import com.lmfinanz.accounts.domain.model.Account;
import com.lmfinanz.categories.application.port.out.CategoryRepositoryPort;
import com.lmfinanz.categories.domain.model.Category;
import com.lmfinanz.categories.domain.model.CategoryType;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.exception.NotFoundException;
import com.lmfinanz.transactions.adapter.in.web.dto.TransactionRequest;
import com.lmfinanz.transactions.adapter.in.web.dto.TransactionResponse;
import com.lmfinanz.transactions.application.port.in.TransactionUseCase;
import com.lmfinanz.transactions.application.port.out.TransactionRepositoryPort;
import com.lmfinanz.transactions.domain.model.Transaction;
import com.lmfinanz.transactions.domain.model.TransactionStatus;
import com.lmfinanz.transactions.domain.model.TransactionType;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TransactionService implements TransactionUseCase {

    private final TransactionRepositoryPort transactionRepository;
    private final AccountRepositoryPort accountRepository;
    private final CategoryRepositoryPort categoryRepository;
    private final ReferenceDataRepositoryPort referenceDataRepository;

    public TransactionService(
            TransactionRepositoryPort transactionRepository,
            AccountRepositoryPort accountRepository,
            CategoryRepositoryPort categoryRepository,
            ReferenceDataRepositoryPort referenceDataRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.referenceDataRepository = referenceDataRepository;
    }

    @Override
    public TransactionResponse create(UUID userId, TransactionRequest request) {
        validateReferenceData(request.currencyCode(), request.countryCode());
        validateByType(userId, request);

        Transaction transaction = new Transaction(
                userId,
                request.type(),
                request.sourceAccountId(),
                request.targetAccountId(),
                request.categoryId(),
                request.currencyCode(),
                request.countryCode(),
                request.amount(),
                request.transactionDate(),
                normalizeDescription(request.description())
        );
        return toResponse(transactionRepository.save(transaction));
    }

    @Override
    public TransactionResponse post(UUID userId, UUID transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new NotFoundException("Transaction not found"));

        if (transaction.getStatus() != TransactionStatus.DRAFT) {
            throw new DomainException("Only draft transactions can be posted");
        }

        switch (transaction.getType()) {
            case INCOME -> postIncome(userId, transaction);
            case EXPENSE -> postExpense(userId, transaction);
            case TRANSFER -> postTransfer(userId, transaction);
        }

        transaction.post();
        return toResponse(transactionRepository.save(transaction));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> list(UUID userId, LocalDate from, LocalDate to) {
        LocalDate effectiveFrom = from == null ? LocalDate.of(1970, 1, 1) : from;
        LocalDate effectiveTo = to == null ? LocalDate.now() : to;
        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new DomainException("From date must be before or equal to to date");
        }

        return transactionRepository.findAllByUserIdAndDateRange(userId, effectiveFrom, effectiveTo).stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateReferenceData(String currencyCode, String countryCode) {
        if (referenceDataRepository.findCurrencyByCode(currencyCode).isEmpty()) {
            throw new DomainException("Unsupported currency: " + currencyCode);
        }
        if (referenceDataRepository.findCountryByCode(countryCode).isEmpty()) {
            throw new DomainException("Unsupported country: " + countryCode);
        }
    }

    private void validateByType(UUID userId, TransactionRequest request) {
        switch (request.type()) {
            case INCOME -> validateIncome(userId, request);
            case EXPENSE -> validateExpense(userId, request);
            case TRANSFER -> validateTransfer(userId, request);
        }
    }

    private void validateIncome(UUID userId, TransactionRequest request) {
        requireNull(request.sourceAccountId(), "Income transactions cannot have a source account");
        Account target = requireAccount(userId, request.targetAccountId(), "Income transactions require a target account");
        requireAccountReferenceMatch(target, request);
        requireCategory(userId, request.categoryId(), CategoryType.INCOME);
    }

    private void validateExpense(UUID userId, TransactionRequest request) {
        Account source = requireAccount(userId, request.sourceAccountId(), "Expense transactions require a source account");
        requireNull(request.targetAccountId(), "Expense transactions cannot have a target account");
        requireAccountReferenceMatch(source, request);
        requireCategory(userId, request.categoryId(), CategoryType.EXPENSE);
    }

    private void validateTransfer(UUID userId, TransactionRequest request) {
        Account source = requireAccount(userId, request.sourceAccountId(), "Transfer transactions require a source account");
        Account target = requireAccount(userId, request.targetAccountId(), "Transfer transactions require a target account");
        requireNull(request.categoryId(), "Transfer transactions cannot have a category");

        if (request.sourceAccountId().equals(request.targetAccountId())) {
            throw new DomainException("Transfer source and target accounts must be different");
        }
        requireAccountReferenceMatch(source, request);
        requireAccountReferenceMatch(target, request);
    }

    private Account requireAccount(UUID userId, UUID accountId, String nullMessage) {
        if (accountId == null) {
            throw new DomainException(nullMessage);
        }
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new DomainException("Account not found"));
    }

    private Category requireCategory(UUID userId, UUID categoryId, CategoryType expectedType) {
        if (categoryId == null) {
            throw new DomainException("Transaction category is required");
        }
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new DomainException("Category not found"));
        if (category.getType() != expectedType) {
            throw new DomainException("Category type must match transaction type");
        }
        return category;
    }

    private void requireAccountReferenceMatch(Account account, TransactionRequest request) {
        if (!account.getCurrencyCode().equals(request.currencyCode())) {
            throw new DomainException("Transaction currency must match account currency");
        }
        if (!account.getCountryCode().equals(request.countryCode())) {
            throw new DomainException("Transaction country must match account country");
        }
    }

    private void requireNull(UUID value, String message) {
        if (value != null) {
            throw new DomainException(message);
        }
    }

    private void postIncome(UUID userId, Transaction transaction) {
        Account target = accountRepository.findByIdAndUserId(transaction.getTargetAccountId(), userId)
                .orElseThrow(() -> new DomainException("Account not found"));
        target.credit(transaction.getAmount());
        accountRepository.save(target);
    }

    private void postExpense(UUID userId, Transaction transaction) {
        Account source = accountRepository.findByIdAndUserId(transaction.getSourceAccountId(), userId)
                .orElseThrow(() -> new DomainException("Account not found"));
        source.debit(transaction.getAmount());
        accountRepository.save(source);
    }

    private void postTransfer(UUID userId, Transaction transaction) {
        Account source = accountRepository.findByIdAndUserId(transaction.getSourceAccountId(), userId)
                .orElseThrow(() -> new DomainException("Account not found"));
        Account target = accountRepository.findByIdAndUserId(transaction.getTargetAccountId(), userId)
                .orElseThrow(() -> new DomainException("Account not found"));
        source.debit(transaction.getAmount());
        target.credit(transaction.getAmount());
        accountRepository.save(source);
        accountRepository.save(target);
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }

    private TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getType(),
                transaction.getSourceAccountId(),
                transaction.getTargetAccountId(),
                transaction.getCategoryId(),
                transaction.getCurrencyCode(),
                transaction.getCountryCode(),
                transaction.getAmount(),
                transaction.getTransactionDate(),
                transaction.getDescription(),
                transaction.getStatus()
        );
    }
}

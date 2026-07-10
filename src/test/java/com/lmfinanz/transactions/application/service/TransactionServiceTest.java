package com.lmfinanz.transactions.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lmfinanz.accounts.application.port.out.AccountRepositoryPort;
import com.lmfinanz.accounts.domain.model.Account;
import com.lmfinanz.accounts.domain.model.AccountType;
import com.lmfinanz.categories.application.port.out.CategoryRepositoryPort;
import com.lmfinanz.categories.domain.model.Category;
import com.lmfinanz.categories.domain.model.CategoryType;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Country;
import com.lmfinanz.reference.domain.model.Currency;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.transactions.adapter.in.web.dto.TransactionRequest;
import com.lmfinanz.transactions.application.port.out.TransactionRepositoryPort;
import com.lmfinanz.transactions.domain.model.Transaction;
import com.lmfinanz.transactions.domain.model.TransactionStatus;
import com.lmfinanz.transactions.domain.model.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepositoryPort transactionRepository;

    @Mock
    private AccountRepositoryPort accountRepository;

    @Mock
    private CategoryRepositoryPort categoryRepository;

    @Mock
    private ReferenceDataRepositoryPort referenceDataRepository;

    @Test
    void createsExpenseTransactionWhenAccountAndCategoryAreValid() {
        TransactionService service = service();
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        Account account = account("EUR", "DE", "100.00");
        Category category = new Category(userId, null, "Food", CategoryType.EXPENSE, false);
        when(referenceDataRepository.findCurrencyByCode("EUR")).thenReturn(Optional.of(currency()));
        when(referenceDataRepository.findCountryByCode("DE")).thenReturn(Optional.of(country()));
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(categoryRepository.findByIdAndUserId(categoryId, userId)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(userId, expenseRequest(accountId, categoryId));

        assertThat(response.type()).isEqualTo(TransactionType.EXPENSE);
        assertThat(response.sourceAccountId()).isEqualTo(accountId);
        assertThat(response.categoryId()).isEqualTo(categoryId);
        assertThat(response.status()).isEqualTo(TransactionStatus.DRAFT);
    }

    @Test
    void rejectsTransferToSameAccount() {
        TransactionService service = service();
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        Account account = account("EUR", "DE", "100.00");
        when(referenceDataRepository.findCurrencyByCode("EUR")).thenReturn(Optional.of(currency()));
        when(referenceDataRepository.findCountryByCode("DE")).thenReturn(Optional.of(country()));
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> service.create(userId, transferRequest(accountId, accountId)))
                .isInstanceOf(DomainException.class)
                .hasMessage("Transfer source and target accounts must be different");
    }

    @Test
    void postsIncomeAndCreditsTargetAccount() {
        TransactionService service = service();
        UUID userId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        Account account = account("EUR", "DE", "100.00");
        Transaction transaction = new Transaction(
                userId,
                TransactionType.INCOME,
                null,
                accountId,
                UUID.randomUUID(),
                "EUR",
                "DE",
                new BigDecimal("50.00"),
                LocalDate.now(),
                "Salary"
        );
        when(transactionRepository.findByIdAndUserId(transactionId, userId)).thenReturn(Optional.of(transaction));
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(transactionRepository.save(transaction)).thenReturn(transaction);

        var response = service.post(userId, transactionId);

        assertThat(account.getCurrentBalance()).isEqualByComparingTo("150.00");
        assertThat(response.status()).isEqualTo(TransactionStatus.POSTED);
        verify(accountRepository).save(account);
    }

    @Test
    void cancelsDraftTransactionWithoutChangingBalances() {
        TransactionService service = service();
        UUID userId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();
        Transaction transaction = expenseTransaction(userId, UUID.randomUUID(), UUID.randomUUID(), "10.00");
        when(transactionRepository.findByIdAndUserId(transactionId, userId)).thenReturn(Optional.of(transaction));
        when(transactionRepository.save(transaction)).thenReturn(transaction);

        var response = service.cancel(userId, transactionId);

        assertThat(response.status()).isEqualTo(TransactionStatus.CANCELLED);
    }

    @Test
    void cancelsPostedExpenseAndCreditsSourceAccount() {
        TransactionService service = service();
        UUID userId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        Account account = account("EUR", "DE", "90.00");
        Transaction transaction = expenseTransaction(userId, accountId, UUID.randomUUID(), "10.00");
        transaction.post();
        when(transactionRepository.findByIdAndUserId(transactionId, userId)).thenReturn(Optional.of(transaction));
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(transactionRepository.save(transaction)).thenReturn(transaction);

        var response = service.cancel(userId, transactionId);

        assertThat(account.getCurrentBalance()).isEqualByComparingTo("100.00");
        assertThat(response.status()).isEqualTo(TransactionStatus.CANCELLED);
        verify(accountRepository).save(account);
    }

    @Test
    void rejectsAlreadyCancelledTransaction() {
        TransactionService service = service();
        UUID userId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();
        Transaction transaction = expenseTransaction(userId, UUID.randomUUID(), UUID.randomUUID(), "10.00");
        transaction.cancel();
        when(transactionRepository.findByIdAndUserId(transactionId, userId)).thenReturn(Optional.of(transaction));

        assertThatThrownBy(() -> service.cancel(userId, transactionId))
                .isInstanceOf(DomainException.class)
                .hasMessage("Transaction is already cancelled");
    }

    private TransactionService service() {
        return new TransactionService(
                transactionRepository,
                accountRepository,
                categoryRepository,
                referenceDataRepository
        );
    }

    private Account account(String currencyCode, String countryCode, String balance) {
        return new Account(
                UUID.randomUUID(),
                "Main account",
                AccountType.BANK_ACCOUNT,
                currencyCode,
                countryCode,
                new BigDecimal(balance)
        );
    }

    private TransactionRequest expenseRequest(UUID accountId, UUID categoryId) {
        return new TransactionRequest(
                TransactionType.EXPENSE,
                accountId,
                null,
                categoryId,
                "EUR",
                "DE",
                new BigDecimal("10.00"),
                LocalDate.now(),
                "Lunch"
        );
    }

    private TransactionRequest transferRequest(UUID sourceAccountId, UUID targetAccountId) {
        return new TransactionRequest(
                TransactionType.TRANSFER,
                sourceAccountId,
                targetAccountId,
                null,
                "EUR",
                "DE",
                new BigDecimal("10.00"),
                LocalDate.now(),
                "Move money"
        );
    }

    private Transaction expenseTransaction(UUID userId, UUID accountId, UUID categoryId, String amount) {
        return new Transaction(
                userId,
                TransactionType.EXPENSE,
                accountId,
                null,
                categoryId,
                "EUR",
                "DE",
                new BigDecimal(amount),
                LocalDate.now(),
                "Lunch"
        );
    }

    private Currency currency() {
        return new Currency("EUR", "Euro", "EUR", 2);
    }

    private Country country() {
        return new Country("DE", "Germany", "EUR");
    }
}

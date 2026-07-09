package com.lmfinanz.accounts.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.lmfinanz.accounts.adapter.in.web.dto.AccountRequest;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountUpdateRequest;
import com.lmfinanz.accounts.application.port.out.AccountRepositoryPort;
import com.lmfinanz.accounts.domain.model.Account;
import com.lmfinanz.accounts.domain.model.AccountType;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.reference.domain.model.Country;
import com.lmfinanz.reference.domain.model.Currency;
import com.lmfinanz.shared.domain.exception.DomainException;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepositoryPort accountRepository;

    @Mock
    private ReferenceDataRepositoryPort referenceDataRepository;

    @Test
    void createsAccountForSupportedCountryAndCurrency() {
        AccountService service = new AccountService(accountRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("EUR"))
                .thenReturn(Optional.of(new Currency("EUR", "Euro", "EUR", 2)));
        when(referenceDataRepository.findCountryByCode("DE"))
                .thenReturn(Optional.of(new Country("DE", "Germany", "EUR")));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(UUID.randomUUID(), request("EUR", "DE"));

        assertThat(response.name()).isEqualTo("Main account");
        assertThat(response.currentBalance()).isEqualByComparingTo("100.00");
    }

    @Test
    void rejectsUnsupportedCurrency() {
        AccountService service = new AccountService(accountRepository, referenceDataRepository);
        when(referenceDataRepository.findCurrencyByCode("GBP")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), request("GBP", "DE")))
                .isInstanceOf(DomainException.class)
                .hasMessage("Unsupported currency: GBP");
    }

    @Test
    void updatesAccountName() {
        AccountService service = new AccountService(accountRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        Account account = new Account(
                userId,
                "Old name",
                AccountType.BANK_ACCOUNT,
                "EUR",
                "DE",
                new BigDecimal("100.00")
        );
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.update(userId, accountId, new AccountUpdateRequest("Updated name"));

        assertThat(response.name()).isEqualTo("Updated name");
        assertThat(response.currentBalance()).isEqualByComparingTo("100.00");
    }

    @Test
    void closesAndReopensAccount() {
        AccountService service = new AccountService(accountRepository, referenceDataRepository);
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        Account account = new Account(
                userId,
                "Main account",
                AccountType.BANK_ACCOUNT,
                "EUR",
                "DE",
                new BigDecimal("100.00")
        );
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var closed = service.close(userId, accountId);
        var reopened = service.reopen(userId, accountId);

        assertThat(closed.active()).isFalse();
        assertThat(reopened.active()).isTrue();
    }

    private AccountRequest request(String currency, String country) {
        return new AccountRequest(
                "Main account",
                AccountType.BANK_ACCOUNT,
                currency,
                country,
                new BigDecimal("100.00")
        );
    }
}

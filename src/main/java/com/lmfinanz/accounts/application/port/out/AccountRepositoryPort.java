package com.lmfinanz.accounts.application.port.out;

import com.lmfinanz.accounts.domain.model.Account;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepositoryPort {

    Account save(Account account);

    Optional<Account> findByIdAndUserId(UUID id, UUID userId);

    List<Account> findAllByUserId(UUID userId);
}

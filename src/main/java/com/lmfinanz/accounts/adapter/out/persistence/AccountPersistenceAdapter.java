package com.lmfinanz.accounts.adapter.out.persistence;

import com.lmfinanz.accounts.application.port.out.AccountRepositoryPort;
import com.lmfinanz.accounts.domain.model.Account;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class AccountPersistenceAdapter implements AccountRepositoryPort {

    private final SpringDataAccountRepository repository;

    public AccountPersistenceAdapter(SpringDataAccountRepository repository) {
        this.repository = repository;
    }

    @Override
    public Account save(Account account) {
        return repository.save(account);
    }

    @Override
    public Optional<Account> findByIdAndUserId(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId);
    }

    @Override
    public List<Account> findAllByUserId(UUID userId) {
        return repository.findAllByUserIdOrderByNameAsc(userId);
    }

    @Override
    public void delete(Account account) {
        repository.delete(account);
    }
}

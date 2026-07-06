package com.lmfinanz.transactions.adapter.out.persistence;

import com.lmfinanz.transactions.application.port.out.TransactionRepositoryPort;
import com.lmfinanz.transactions.domain.model.Transaction;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class TransactionPersistenceAdapter implements TransactionRepositoryPort {

    private final SpringDataTransactionRepository repository;

    public TransactionPersistenceAdapter(SpringDataTransactionRepository repository) {
        this.repository = repository;
    }

    @Override
    public Transaction save(Transaction transaction) {
        return repository.save(transaction);
    }

    @Override
    public Optional<Transaction> findByIdAndUserId(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId);
    }

    @Override
    public List<Transaction> findAllByUserIdAndDateRange(UUID userId, LocalDate from, LocalDate to) {
        return repository.findAllByUserIdAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
                userId,
                from,
                to
        );
    }
}

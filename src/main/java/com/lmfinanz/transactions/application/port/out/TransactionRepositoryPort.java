package com.lmfinanz.transactions.application.port.out;

import com.lmfinanz.transactions.domain.model.Transaction;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepositoryPort {

    Transaction save(Transaction transaction);

    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    List<Transaction> findAllByUserIdAndDateRange(UUID userId, LocalDate from, LocalDate to);
}

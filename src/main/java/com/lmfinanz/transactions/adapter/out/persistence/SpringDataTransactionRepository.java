package com.lmfinanz.transactions.adapter.out.persistence;

import com.lmfinanz.transactions.domain.model.Transaction;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataTransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    List<Transaction> findAllByUserIdAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
            UUID userId,
            LocalDate from,
            LocalDate to
    );

    boolean existsByUserIdAndSourceAccountIdOrUserIdAndTargetAccountId(
            UUID sourceUserId,
            UUID sourceAccountId,
            UUID targetUserId,
            UUID targetAccountId
    );
}

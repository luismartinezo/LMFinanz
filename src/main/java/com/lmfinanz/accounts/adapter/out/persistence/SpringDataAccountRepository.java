package com.lmfinanz.accounts.adapter.out.persistence;

import com.lmfinanz.accounts.domain.model.Account;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataAccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByIdAndUserId(UUID id, UUID userId);

    List<Account> findAllByUserIdOrderByNameAsc(UUID userId);
}

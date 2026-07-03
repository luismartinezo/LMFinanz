package com.lmfinanz.reference.adapter.out.persistence;

import com.lmfinanz.reference.domain.model.Currency;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataCurrencyRepository extends JpaRepository<Currency, UUID> {

    Optional<Currency> findByCode(String code);
}

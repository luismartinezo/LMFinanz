package com.lmfinanz.reference.adapter.out.persistence;

import com.lmfinanz.reference.domain.model.Country;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataCountryRepository extends JpaRepository<Country, UUID> {

    Optional<Country> findByCode(String code);
}

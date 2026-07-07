package com.lmfinanz.savings.adapter.out.persistence;

import com.lmfinanz.savings.domain.model.SavingsContribution;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataSavingsContributionRepository extends JpaRepository<SavingsContribution, UUID> {
}

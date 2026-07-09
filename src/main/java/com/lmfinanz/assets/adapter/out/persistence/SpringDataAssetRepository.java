package com.lmfinanz.assets.adapter.out.persistence;

import com.lmfinanz.assets.domain.model.Asset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataAssetRepository extends JpaRepository<Asset, UUID> {

    Optional<Asset> findByIdAndUserId(UUID id, UUID userId);

    List<Asset> findAllByUserIdOrderByTypeAscNameAsc(UUID userId);
}

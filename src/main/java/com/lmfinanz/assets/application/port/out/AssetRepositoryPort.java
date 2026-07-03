package com.lmfinanz.assets.application.port.out;

import com.lmfinanz.assets.domain.model.Asset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssetRepositoryPort {

    Asset save(Asset asset);

    Optional<Asset> findByIdAndUserId(UUID id, UUID userId);

    List<Asset> findAllByUserId(UUID userId);
}

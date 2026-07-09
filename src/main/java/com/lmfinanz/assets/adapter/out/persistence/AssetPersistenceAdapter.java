package com.lmfinanz.assets.adapter.out.persistence;

import com.lmfinanz.assets.application.port.out.AssetRepositoryPort;
import com.lmfinanz.assets.domain.model.Asset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class AssetPersistenceAdapter implements AssetRepositoryPort {

    private final SpringDataAssetRepository repository;

    public AssetPersistenceAdapter(SpringDataAssetRepository repository) {
        this.repository = repository;
    }

    @Override
    public Asset save(Asset asset) {
        return repository.save(asset);
    }

    @Override
    public Optional<Asset> findByIdAndUserId(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId);
    }

    @Override
    public List<Asset> findAllByUserId(UUID userId) {
        return repository.findAllByUserIdOrderByTypeAscNameAsc(userId);
    }
}

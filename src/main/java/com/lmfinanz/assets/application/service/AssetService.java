package com.lmfinanz.assets.application.service;

import com.lmfinanz.assets.adapter.in.web.dto.AssetRequest;
import com.lmfinanz.assets.adapter.in.web.dto.AssetResponse;
import com.lmfinanz.assets.application.port.in.AssetUseCase;
import com.lmfinanz.assets.application.port.out.AssetRepositoryPort;
import com.lmfinanz.assets.domain.model.Asset;
import com.lmfinanz.reference.application.port.out.ReferenceDataRepositoryPort;
import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.exception.NotFoundException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AssetService implements AssetUseCase {

    private final AssetRepositoryPort assetRepository;
    private final ReferenceDataRepositoryPort referenceDataRepository;

    public AssetService(
            AssetRepositoryPort assetRepository,
            ReferenceDataRepositoryPort referenceDataRepository
    ) {
        this.assetRepository = assetRepository;
        this.referenceDataRepository = referenceDataRepository;
    }

    @Override
    public AssetResponse create(UUID userId, AssetRequest request) {
        validateReferenceData(request.currencyCode(), request.countryCode());
        Asset asset = new Asset(
                userId,
                request.name().trim(),
                request.type(),
                request.currencyCode(),
                request.countryCode(),
                request.estimatedValue(),
                request.acquisitionDate(),
                normalizeDescription(request.description())
        );
        return toResponse(assetRepository.save(asset));
    }

    @Override
    @Transactional(readOnly = true)
    public AssetResponse get(UUID userId, UUID assetId) {
        return assetRepository.findByIdAndUserId(assetId, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Asset not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetResponse> list(UUID userId) {
        return assetRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateReferenceData(String currencyCode, String countryCode) {
        if (referenceDataRepository.findCurrencyByCode(currencyCode).isEmpty()) {
            throw new DomainException("Unsupported currency: " + currencyCode);
        }
        if (referenceDataRepository.findCountryByCode(countryCode).isEmpty()) {
            throw new DomainException("Unsupported country: " + countryCode);
        }
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }

    private AssetResponse toResponse(Asset asset) {
        return new AssetResponse(
                asset.getId(),
                asset.getName(),
                asset.getType(),
                asset.getCurrencyCode(),
                asset.getCountryCode(),
                asset.getEstimatedValue(),
                asset.getAcquisitionDate(),
                asset.getDescription(),
                asset.isActive()
        );
    }
}

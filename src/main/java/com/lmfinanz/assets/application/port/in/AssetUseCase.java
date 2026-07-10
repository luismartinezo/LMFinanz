package com.lmfinanz.assets.application.port.in;

import com.lmfinanz.assets.adapter.in.web.dto.AssetRequest;
import com.lmfinanz.assets.adapter.in.web.dto.AssetResponse;
import com.lmfinanz.assets.adapter.in.web.dto.AssetUpdateRequest;
import java.util.List;
import java.util.UUID;

public interface AssetUseCase {

    AssetResponse create(UUID userId, AssetRequest request);

    AssetResponse get(UUID userId, UUID assetId);

    List<AssetResponse> list(UUID userId);

    AssetResponse update(UUID userId, UUID assetId, AssetUpdateRequest request);

    AssetResponse retire(UUID userId, UUID assetId);

    AssetResponse activate(UUID userId, UUID assetId);
}

package com.lmfinanz.assets.application.port.in;

import com.lmfinanz.assets.adapter.in.web.dto.AssetRequest;
import com.lmfinanz.assets.adapter.in.web.dto.AssetResponse;
import java.util.List;
import java.util.UUID;

public interface AssetUseCase {

    AssetResponse create(UUID userId, AssetRequest request);

    AssetResponse get(UUID userId, UUID assetId);

    List<AssetResponse> list(UUID userId);
}

package com.lmfinanz.assets.adapter.in.web;

import com.lmfinanz.assets.adapter.in.web.dto.AssetRequest;
import com.lmfinanz.assets.adapter.in.web.dto.AssetResponse;
import com.lmfinanz.assets.adapter.in.web.dto.AssetUpdateRequest;
import com.lmfinanz.assets.application.port.in.AssetUseCase;
import com.lmfinanz.shared.security.JwtPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assets")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class AssetController {

    private final AssetUseCase assetUseCase;

    public AssetController(AssetUseCase assetUseCase) {
        this.assetUseCase = assetUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssetResponse create(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody AssetRequest request
    ) {
        return assetUseCase.create(principal.userId(), request);
    }

    @GetMapping("/{assetId}")
    public AssetResponse get(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID assetId
    ) {
        return assetUseCase.get(principal.userId(), assetId);
    }

    @GetMapping
    public List<AssetResponse> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return assetUseCase.list(principal.userId());
    }

    @PutMapping("/{assetId}")
    public AssetResponse update(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID assetId,
            @Valid @RequestBody AssetUpdateRequest request
    ) {
        return assetUseCase.update(principal.userId(), assetId, request);
    }

    @PatchMapping("/{assetId}/retire")
    public AssetResponse retire(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID assetId
    ) {
        return assetUseCase.retire(principal.userId(), assetId);
    }

    @PatchMapping("/{assetId}/activate")
    public AssetResponse activate(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable UUID assetId
    ) {
        return assetUseCase.activate(principal.userId(), assetId);
    }
}

package com.lmfinanz.accounts.application.port.in;

import com.lmfinanz.accounts.adapter.in.web.dto.AccountRequest;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountResponse;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountUpdateRequest;
import java.util.List;
import java.util.UUID;

public interface AccountUseCase {

    AccountResponse create(UUID userId, AccountRequest request);

    AccountResponse get(UUID userId, UUID accountId);

    List<AccountResponse> list(UUID userId);

    AccountResponse update(UUID userId, UUID accountId, AccountUpdateRequest request);

    AccountResponse close(UUID userId, UUID accountId);

    AccountResponse reopen(UUID userId, UUID accountId);

    void delete(UUID userId, UUID accountId);
}

package com.lmfinanz.accounts.application.port.in;

import com.lmfinanz.accounts.adapter.in.web.dto.AccountRequest;
import com.lmfinanz.accounts.adapter.in.web.dto.AccountResponse;
import java.util.List;
import java.util.UUID;

public interface AccountUseCase {

    AccountResponse create(UUID userId, AccountRequest request);

    AccountResponse get(UUID userId, UUID accountId);

    List<AccountResponse> list(UUID userId);
}

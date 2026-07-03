package com.lmfinanz.transactions.application.port.in;

import com.lmfinanz.transactions.adapter.in.web.dto.TransactionRequest;
import com.lmfinanz.transactions.adapter.in.web.dto.TransactionResponse;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TransactionUseCase {

    TransactionResponse create(UUID userId, TransactionRequest request);

    TransactionResponse post(UUID userId, UUID transactionId);

    List<TransactionResponse> list(UUID userId, LocalDate from, LocalDate to);
}

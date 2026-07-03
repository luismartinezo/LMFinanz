package com.lmfinanz.shared.adapter.in.web;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        List<FieldViolation> violations
) {
    public record FieldViolation(String field, String message) {
    }
}

package com.lmfinanz.shared.adapter.in.web;

import com.lmfinanz.shared.domain.exception.DomainException;
import com.lmfinanz.shared.domain.exception.AuthenticationFailedException;
import com.lmfinanz.shared.domain.exception.ConflictException;
import com.lmfinanz.shared.domain.exception.NotFoundException;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationFailedException.class)
    ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationFailedException ex) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage(), List.of());
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ApiErrorResponse> handleConflict(ConflictException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage(), List.of());
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ApiErrorResponse> handleNotFound(NotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage(), List.of());
    }

    @ExceptionHandler(DomainException.class)
    ResponseEntity<ApiErrorResponse> handleDomain(DomainException ex) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleInvalidBody(MethodArgumentNotValidException ex) {
        List<ApiErrorResponse.FieldViolation> violations = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> new ApiErrorResponse.FieldViolation(error.getField(), error.getDefaultMessage()))
                .toList();
        return error(HttpStatus.BAD_REQUEST, "Validation failed", violations);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        List<ApiErrorResponse.FieldViolation> violations = ex.getConstraintViolations()
                .stream()
                .map(error -> new ApiErrorResponse.FieldViolation(error.getPropertyPath().toString(), error.getMessage()))
                .toList();
        return error(HttpStatus.BAD_REQUEST, "Validation failed", violations);
    }

    private ResponseEntity<ApiErrorResponse> error(
            HttpStatus status,
            String message,
            List<ApiErrorResponse.FieldViolation> violations
    ) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                violations
        ));
    }
}

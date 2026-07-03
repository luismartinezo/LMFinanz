package com.lmfinanz.identity.adapter.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterUserRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 10, max = 120) String password,
        @NotBlank @Size(max = 140) String fullName
) {
}

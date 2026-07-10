package com.lmfinanz.shared.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lmfinanz.accounts.adapter.in.web.AccountController;
import com.lmfinanz.accounts.application.port.in.AccountUseCase;
import com.lmfinanz.identity.adapter.in.web.AuthController;
import com.lmfinanz.identity.adapter.in.web.UserAdminController;
import com.lmfinanz.identity.adapter.in.web.dto.AuthResponse;
import com.lmfinanz.identity.application.port.in.AuthUseCase;
import com.lmfinanz.identity.application.port.in.UserAdminUseCase;
import com.lmfinanz.identity.application.service.LoginRateLimiter;
import com.lmfinanz.reference.adapter.in.web.ReferenceDataController;
import com.lmfinanz.reference.application.port.in.ReferenceDataUseCase;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = {
        AuthController.class,
        ReferenceDataController.class,
        AccountController.class,
        UserAdminController.class
})
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        ApiAuthenticationEntryPoint.class,
        ApiAccessDeniedHandler.class
})
class SecurityWebIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JwtTokenPort jwtTokenPort;

    @MockBean
    private AuthUseCase authUseCase;

    @MockBean
    private LoginRateLimiter loginRateLimiter;

    @MockBean
    private ReferenceDataUseCase referenceDataUseCase;

    @MockBean
    private AccountUseCase accountUseCase;

    @MockBean
    private UserAdminUseCase userAdminUseCase;

    @Test
    void publicReferenceEndpointDoesNotRequireToken() throws Exception {
        when(referenceDataUseCase.currencies()).thenReturn(List.of());

        mockMvc.perform(get("/api/reference/currencies"))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpointRequiresToken() throws Exception {
        mockMvc.perform(get("/api/accounts"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void protectedEndpointAllowsValidUserToken() throws Exception {
        when(jwtTokenPort.validateToken("user-token")).thenReturn(new JwtPrincipal(
                UUID.randomUUID(),
                "user@example.com",
                Set.of("ROLE_USER")
        ));
        when(accountUseCase.list(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/accounts")
                        .header("Authorization", "Bearer user-token"))
                .andExpect(status().isOk());
    }

    @Test
    void adminEndpointRejectsUserRole() throws Exception {
        when(jwtTokenPort.validateToken("user-token")).thenReturn(new JwtPrincipal(
                UUID.randomUUID(),
                "user@example.com",
                Set.of("ROLE_USER")
        ));

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer user-token"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void adminEndpointAllowsAdminRole() throws Exception {
        when(jwtTokenPort.validateToken("admin-token")).thenReturn(new JwtPrincipal(
                UUID.randomUUID(),
                "admin@example.com",
                Set.of("ROLE_ADMIN")
        ));
        when(userAdminUseCase.list()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer admin-token"))
                .andExpect(status().isOk());
    }

    @Test
    void invalidTokenReturnsUnauthorized() throws Exception {
        when(jwtTokenPort.validateToken("bad-token")).thenThrow(new IllegalArgumentException("bad token"));

        mockMvc.perform(get("/api/accounts")
                        .header("Authorization", "Bearer bad-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication is required"));
    }

    @Test
    void loginEndpointIsPublic() throws Exception {
        var response = new AuthResponse(
                UUID.randomUUID(),
                "user@example.com",
                "Test User",
                Set.of("ROLE_USER"),
                "access-token",
                "refresh-token"
        );
        when(authUseCase.login(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "email", "user@example.com",
                                "password", "StrongPass123!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"));
    }
}

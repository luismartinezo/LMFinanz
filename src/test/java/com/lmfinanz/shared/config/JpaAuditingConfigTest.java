package com.lmfinanz.shared.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.lmfinanz.shared.security.JwtPrincipal;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class JpaAuditingConfigTest {

    private final JpaAuditingConfig config = new JpaAuditingConfig();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void returnsCurrentJwtPrincipalUserIdAsAuditor() {
        UUID userId = UUID.randomUUID();
        JwtPrincipal principal = new JwtPrincipal(userId, "admin@lmfinanz.com", Set.of("ROLE_ADMIN"));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, java.util.List.of())
        );

        var auditor = config.auditorAware().getCurrentAuditor();

        assertThat(auditor).contains(userId);
    }

    @Test
    void returnsEmptyAuditorWithoutAuthentication() {
        var auditor = config.auditorAware().getCurrentAuditor();

        assertThat(auditor).isEmpty();
    }
}

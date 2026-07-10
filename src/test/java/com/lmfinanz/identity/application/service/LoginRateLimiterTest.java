package com.lmfinanz.identity.application.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lmfinanz.shared.domain.exception.TooManyRequestsException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class LoginRateLimiterTest {

    private final Clock clock = Clock.fixed(Instant.parse("2026-07-10T10:00:00Z"), ZoneOffset.UTC);

    @Test
    void blocksAfterMaxFailuresWithinWindow() {
        LoginRateLimiter limiter = new LoginRateLimiter(2, Duration.ofMinutes(15), clock);

        limiter.recordFailure("User@Example.com", "127.0.0.1");
        limiter.recordFailure("user@example.com", "127.0.0.1");

        assertThatThrownBy(() -> limiter.assertAllowed("user@example.com", "127.0.0.1"))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessage("Too many login attempts. Try again later.");
    }

    @Test
    void clearAllowsLoginAgain() {
        LoginRateLimiter limiter = new LoginRateLimiter(1, Duration.ofMinutes(15), clock);

        limiter.recordFailure("user@example.com", "127.0.0.1");
        limiter.clear("user@example.com", "127.0.0.1");

        limiter.assertAllowed("user@example.com", "127.0.0.1");
    }
}

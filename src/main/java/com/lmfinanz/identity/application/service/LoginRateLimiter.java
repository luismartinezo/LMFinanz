package com.lmfinanz.identity.application.service;

import com.lmfinanz.shared.domain.exception.TooManyRequestsException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LoginRateLimiter {

    private final ConcurrentHashMap<String, AttemptWindow> attempts = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final Duration window;
    private final Clock clock;

    public LoginRateLimiter(
            @Value("${security.login-rate-limit.max-attempts}") int maxAttempts,
            @Value("${security.login-rate-limit.window-minutes}") long windowMinutes
    ) {
        this(maxAttempts, Duration.ofMinutes(windowMinutes), Clock.systemUTC());
    }

    LoginRateLimiter(int maxAttempts, Duration window, Clock clock) {
        this.maxAttempts = maxAttempts;
        this.window = window;
        this.clock = clock;
    }

    public void assertAllowed(String email, String clientIp) {
        String key = key(email, clientIp);
        Instant now = Instant.now(clock);
        AttemptWindow attemptWindow = attempts.get(key);
        if (attemptWindow == null || !attemptWindow.expiresAt().isAfter(now)) {
            return;
        }
        if (attemptWindow.count() >= maxAttempts) {
            throw new TooManyRequestsException("Too many login attempts. Try again later.");
        }
    }

    public void recordFailure(String email, String clientIp) {
        String key = key(email, clientIp);
        Instant now = Instant.now(clock);
        attempts.compute(key, (ignored, current) -> {
            if (current == null || !current.expiresAt().isAfter(now)) {
                return new AttemptWindow(1, now.plus(window));
            }
            return new AttemptWindow(current.count() + 1, current.expiresAt());
        });
    }

    public void clear(String email, String clientIp) {
        attempts.remove(key(email, clientIp));
    }

    private String key(String email, String clientIp) {
        return email.trim().toLowerCase(Locale.ROOT) + "|" + clientIp;
    }

    private record AttemptWindow(int count, Instant expiresAt) {
    }
}

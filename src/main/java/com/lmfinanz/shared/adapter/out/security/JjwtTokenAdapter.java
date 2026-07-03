package com.lmfinanz.shared.adapter.out.security;

import com.lmfinanz.shared.security.JwtPrincipal;
import com.lmfinanz.shared.security.JwtTokenPort;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JjwtTokenAdapter implements JwtTokenPort {

    private final String issuer;
    private final SecretKey secretKey;
    private final long expirationMinutes;

    public JjwtTokenAdapter(
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.expiration-minutes}") long expirationMinutes
    ) {
        this.issuer = issuer;
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    @Override
    public String issueToken(JwtPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(issuer)
                .subject(principal.userId().toString())
                .claim("email", principal.email())
                .claim("roles", principal.roles())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .signWith(secretKey)
                .compact();
    }

    @Override
    public JwtPrincipal validateToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        @SuppressWarnings("unchecked")
        List<String> roles = claims.get("roles", List.class);
        return new JwtPrincipal(
                UUID.fromString(claims.getSubject()),
                claims.get("email", String.class),
                Set.copyOf(roles)
        );
    }
}

package com.lmfinanz.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenPort jwtTokenPort;
    private final ApiAuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(
            JwtTokenPort jwtTokenPort,
            ApiAuthenticationEntryPoint authenticationEntryPoint
    ) {
        this.jwtTokenPort = jwtTokenPort;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                JwtPrincipal principal = jwtTokenPort.validateToken(authorization.substring(7));
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        principal.roles().stream().map(SimpleGrantedAuthority::new).toList()
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException ex) {
                SecurityContextHolder.clearContext();
                authenticationEntryPoint.commence(
                        request,
                        response,
                        new BadCredentialsException("Invalid or expired access token", ex)
                );
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}

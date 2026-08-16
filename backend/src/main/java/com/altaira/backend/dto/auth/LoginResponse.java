package com.altaira.backend.dto.auth;

import java.time.Instant;

public class LoginResponse {
    private String sessionToken;
    private Instant expiresAt;
    private AuthUserResponse user;

    public LoginResponse(String sessionToken, Instant expiresAt, AuthUserResponse user) {
        this.sessionToken = sessionToken;
        this.expiresAt = expiresAt;
        this.user = user;
    }

    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public AuthUserResponse getUser() { return user; }
    public void setUser(AuthUserResponse user) { this.user = user; }
}

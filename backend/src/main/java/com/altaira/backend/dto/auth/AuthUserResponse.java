package com.altaira.backend.dto.auth;

import java.time.Instant;
import java.util.UUID;

public class AuthUserResponse {
    private UUID id;
    private String username;
    private String role;
    private boolean active;
    private Instant lastLoginAt;

    public AuthUserResponse(UUID id, String username, String role, boolean active, Instant lastLoginAt) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.active = active;
        this.lastLoginAt = lastLoginAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}

package com.altaira.backend.dto.clientinvitation;

import java.time.Instant;
import java.util.UUID;

public class ClientInvitationResponse {
    private UUID id;
    private UUID clientId;
    private String email;
    private String role;
    private String status;
    private Instant expiresAt;
    private Instant acceptedAt;
    private Instant revokedAt;
    private boolean emailSent;
    private String emailMessage;
    private String invitationUrl;
    private Instant createdAt;
    private Instant updatedAt;

    public ClientInvitationResponse() {}

    public ClientInvitationResponse(
            UUID id,
            UUID clientId,
            String email,
            String role,
            String status,
            Instant expiresAt,
            Instant acceptedAt,
            Instant revokedAt,
            boolean emailSent,
            String emailMessage,
            String invitationUrl,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.clientId = clientId;
        this.email = email;
        this.role = role;
        this.status = status;
        this.expiresAt = expiresAt;
        this.acceptedAt = acceptedAt;
        this.revokedAt = revokedAt;
        this.emailSent = emailSent;
        this.emailMessage = emailMessage;
        this.invitationUrl = invitationUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }

    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }

    public boolean isEmailSent() { return emailSent; }
    public void setEmailSent(boolean emailSent) { this.emailSent = emailSent; }

    public String getEmailMessage() { return emailMessage; }
    public void setEmailMessage(String emailMessage) { this.emailMessage = emailMessage; }

    public String getInvitationUrl() { return invitationUrl; }
    public void setInvitationUrl(String invitationUrl) { this.invitationUrl = invitationUrl; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

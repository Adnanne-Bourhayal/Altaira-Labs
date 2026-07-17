package com.altaira.backend.dto.clientcrm;

import java.time.Instant;
import java.util.UUID;

public class ClientCrmWebhookTokenResponse {
    private UUID id;
    private UUID clientId;
    private String label;
    private String tokenPrefix;
    private boolean active;
    private String apiKey;
    private String webhookUrl;
    private Instant lastUsedAt;
    private Instant revokedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public ClientCrmWebhookTokenResponse() {}

    public ClientCrmWebhookTokenResponse(
            UUID id,
            UUID clientId,
            String label,
            String tokenPrefix,
            boolean active,
            String apiKey,
            String webhookUrl,
            Instant lastUsedAt,
            Instant revokedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.clientId = clientId;
        this.label = label;
        this.tokenPrefix = tokenPrefix;
        this.active = active;
        this.apiKey = apiKey;
        this.webhookUrl = webhookUrl;
        this.lastUsedAt = lastUsedAt;
        this.revokedAt = revokedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getTokenPrefix() { return tokenPrefix; }
    public void setTokenPrefix(String tokenPrefix) { this.tokenPrefix = tokenPrefix; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getWebhookUrl() { return webhookUrl; }
    public void setWebhookUrl(String webhookUrl) { this.webhookUrl = webhookUrl; }

    public Instant getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(Instant lastUsedAt) { this.lastUsedAt = lastUsedAt; }

    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

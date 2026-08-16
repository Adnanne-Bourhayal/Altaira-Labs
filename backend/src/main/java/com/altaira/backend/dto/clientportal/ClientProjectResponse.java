package com.altaira.backend.dto.clientportal;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ClientProjectResponse {
    private UUID id;
    private UUID clientServiceId;
    private String projectKey;
    private String name;
    private String currentPhase;
    private String stagingUrl;
    private String latestClientFeedback;
    private Instant revisionPendingAt;
    private List<ClientProjectAssetResponse> assets;
    private Instant createdAt;
    private Instant updatedAt;

    public ClientProjectResponse() {}

    public ClientProjectResponse(
            UUID id,
            UUID clientServiceId,
            String projectKey,
            String name,
            String currentPhase,
            String stagingUrl,
            String latestClientFeedback,
            Instant revisionPendingAt,
            List<ClientProjectAssetResponse> assets,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.clientServiceId = clientServiceId;
        this.projectKey = projectKey;
        this.name = name;
        this.currentPhase = currentPhase;
        this.stagingUrl = stagingUrl;
        this.latestClientFeedback = latestClientFeedback;
        this.revisionPendingAt = revisionPendingAt;
        this.assets = assets;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClientServiceId() { return clientServiceId; }
    public void setClientServiceId(UUID clientServiceId) { this.clientServiceId = clientServiceId; }

    public String getProjectKey() { return projectKey; }
    public void setProjectKey(String projectKey) { this.projectKey = projectKey; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(String currentPhase) { this.currentPhase = currentPhase; }

    public String getStagingUrl() { return stagingUrl; }
    public void setStagingUrl(String stagingUrl) { this.stagingUrl = stagingUrl; }

    public String getLatestClientFeedback() { return latestClientFeedback; }
    public void setLatestClientFeedback(String latestClientFeedback) { this.latestClientFeedback = latestClientFeedback; }

    public Instant getRevisionPendingAt() { return revisionPendingAt; }
    public void setRevisionPendingAt(Instant revisionPendingAt) { this.revisionPendingAt = revisionPendingAt; }

    public List<ClientProjectAssetResponse> getAssets() { return assets; }
    public void setAssets(List<ClientProjectAssetResponse> assets) { this.assets = assets; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

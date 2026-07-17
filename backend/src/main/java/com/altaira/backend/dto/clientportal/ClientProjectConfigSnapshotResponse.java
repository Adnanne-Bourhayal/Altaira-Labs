package com.altaira.backend.dto.clientportal;

import java.time.Instant;
import java.util.UUID;

public class ClientProjectConfigSnapshotResponse {
    private UUID id;
    private UUID projectId;
    private UUID clientId;
    private String serviceKey;
    private String artifactType;
    private String label;
    private String configJson;
    private String createdByUsername;
    private Instant createdAt;

    public ClientProjectConfigSnapshotResponse() {}

    public ClientProjectConfigSnapshotResponse(
            UUID id,
            UUID projectId,
            UUID clientId,
            String serviceKey,
            String artifactType,
            String label,
            String configJson,
            String createdByUsername,
            Instant createdAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.clientId = clientId;
        this.serviceKey = serviceKey;
        this.artifactType = artifactType;
        this.label = label;
        this.configJson = configJson;
        this.createdByUsername = createdByUsername;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public String getServiceKey() { return serviceKey; }
    public void setServiceKey(String serviceKey) { this.serviceKey = serviceKey; }

    public String getArtifactType() { return artifactType; }
    public void setArtifactType(String artifactType) { this.artifactType = artifactType; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }

    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

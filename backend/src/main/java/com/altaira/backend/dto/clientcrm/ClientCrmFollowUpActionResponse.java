package com.altaira.backend.dto.clientcrm;

import java.time.Instant;
import java.util.UUID;

public class ClientCrmFollowUpActionResponse {
    private UUID id;
    private UUID leadId;
    private UUID clientId;
    private String title;
    private String description;
    private String status;
    private String ownerRole;
    private String createdByUsername;
    private boolean visibleToClient;
    private Instant dueAt;
    private Instant completedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public ClientCrmFollowUpActionResponse() {}

    public ClientCrmFollowUpActionResponse(
            UUID id,
            UUID leadId,
            UUID clientId,
            String title,
            String description,
            String status,
            String ownerRole,
            String createdByUsername,
            boolean visibleToClient,
            Instant dueAt,
            Instant completedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.leadId = leadId;
        this.clientId = clientId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.ownerRole = ownerRole;
        this.createdByUsername = createdByUsername;
        this.visibleToClient = visibleToClient;
        this.dueAt = dueAt;
        this.completedAt = completedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getLeadId() { return leadId; }
    public void setLeadId(UUID leadId) { this.leadId = leadId; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOwnerRole() { return ownerRole; }
    public void setOwnerRole(String ownerRole) { this.ownerRole = ownerRole; }

    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }

    public boolean isVisibleToClient() { return visibleToClient; }
    public void setVisibleToClient(boolean visibleToClient) { this.visibleToClient = visibleToClient; }

    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

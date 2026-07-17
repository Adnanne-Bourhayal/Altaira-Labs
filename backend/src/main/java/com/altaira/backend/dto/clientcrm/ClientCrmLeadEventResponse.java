package com.altaira.backend.dto.clientcrm;

import java.time.Instant;
import java.util.UUID;

public class ClientCrmLeadEventResponse {
    private UUID id;
    private UUID leadId;
    private String eventType;
    private String actorRole;
    private String actorUsername;
    private String fromStatus;
    private String toStatus;
    private String summary;
    private Instant createdAt;

    public ClientCrmLeadEventResponse() {}

    public ClientCrmLeadEventResponse(
            UUID id,
            UUID leadId,
            String eventType,
            String actorRole,
            String actorUsername,
            String fromStatus,
            String toStatus,
            String summary,
            Instant createdAt
    ) {
        this.id = id;
        this.leadId = leadId;
        this.eventType = eventType;
        this.actorRole = actorRole;
        this.actorUsername = actorUsername;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.summary = summary;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getLeadId() { return leadId; }
    public void setLeadId(UUID leadId) { this.leadId = leadId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getActorUsername() { return actorUsername; }
    public void setActorUsername(String actorUsername) { this.actorUsername = actorUsername; }

    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }

    public String getToStatus() { return toStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

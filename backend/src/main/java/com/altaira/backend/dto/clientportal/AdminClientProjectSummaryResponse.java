package com.altaira.backend.dto.clientportal;

import java.time.Instant;
import java.util.UUID;

public class AdminClientProjectSummaryResponse {
    private UUID id;
    private UUID clientId;
    private String clientName;
    private String clientCompany;
    private String clientStatus;
    private UUID clientServiceId;
    private String serviceName;
    private String projectKey;
    private String name;
    private String currentPhase;
    private boolean reviewPending;
    private Instant revisionPendingAt;
    private Instant updatedAt;

    public AdminClientProjectSummaryResponse() {}

    public AdminClientProjectSummaryResponse(
            UUID id,
            UUID clientId,
            String clientName,
            String clientCompany,
            String clientStatus,
            UUID clientServiceId,
            String serviceName,
            String projectKey,
            String name,
            String currentPhase,
            boolean reviewPending,
            Instant revisionPendingAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.clientId = clientId;
        this.clientName = clientName;
        this.clientCompany = clientCompany;
        this.clientStatus = clientStatus;
        this.clientServiceId = clientServiceId;
        this.serviceName = serviceName;
        this.projectKey = projectKey;
        this.name = name;
        this.currentPhase = currentPhase;
        this.reviewPending = reviewPending;
        this.revisionPendingAt = revisionPendingAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getClientCompany() { return clientCompany; }
    public void setClientCompany(String clientCompany) { this.clientCompany = clientCompany; }

    public String getClientStatus() { return clientStatus; }
    public void setClientStatus(String clientStatus) { this.clientStatus = clientStatus; }

    public UUID getClientServiceId() { return clientServiceId; }
    public void setClientServiceId(UUID clientServiceId) { this.clientServiceId = clientServiceId; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getProjectKey() { return projectKey; }
    public void setProjectKey(String projectKey) { this.projectKey = projectKey; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(String currentPhase) { this.currentPhase = currentPhase; }

    public boolean isReviewPending() { return reviewPending; }
    public void setReviewPending(boolean reviewPending) { this.reviewPending = reviewPending; }

    public Instant getRevisionPendingAt() { return revisionPendingAt; }
    public void setRevisionPendingAt(Instant revisionPendingAt) { this.revisionPendingAt = revisionPendingAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

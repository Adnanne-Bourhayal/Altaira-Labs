package com.altaira.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "client_projects")
public class ClientProjectEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_service_id")
    private ClientServiceEntity clientService;

    @Column(name = "project_key", nullable = false, length = 80)
    private String projectKey = "web_seo";

    @Column(nullable = false)
    private String name;

    @Column(name = "current_phase", nullable = false, length = 40)
    private String currentPhase = "requirements";

    @Column(name = "staging_url")
    private String stagingUrl;

    @Column(name = "latest_client_feedback", columnDefinition = "TEXT")
    private String latestClientFeedback;

    @Column(name = "revision_pending_at")
    private Instant revisionPendingAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public ClientEntity getClient() { return client; }
    public void setClient(ClientEntity client) { this.client = client; }

    public ClientServiceEntity getClientService() { return clientService; }
    public void setClientService(ClientServiceEntity clientService) { this.clientService = clientService; }

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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

package com.altaira.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "provisioning_steps")
public class ProvisioningStepEntity {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "run_id", nullable = false) private ProvisioningRunEntity run;
    @Column(name = "track_key", length = 40) private String trackKey;
    @Column(nullable = false, length = 40) private String provider;
    @Column(nullable = false, length = 100) private String action;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "input_summary_json", nullable = false, columnDefinition = "TEXT") private String inputSummaryJson = "{}";
    @Column(name = "external_resource_id", length = 240) private String externalResourceId;
    @Column(name = "external_url", columnDefinition = "TEXT") private String externalUrl;
    @Column(name = "safe_error", columnDefinition = "TEXT") private String safeError;
    @Column(name = "manual_action_required", nullable = false) private boolean manualActionRequired;
    @Column(name = "idempotency_key", nullable = false, unique = true, length = 240) private String idempotencyKey;
    @Column(nullable = false) private int attempts;
    @Column(name = "started_at") private Instant startedAt;
    @Column(name = "completed_at") private Instant completedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @PrePersist void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public ProvisioningRunEntity getRun() { return run; }
    public void setRun(ProvisioningRunEntity run) { this.run = run; }
    public String getTrackKey() { return trackKey; }
    public void setTrackKey(String trackKey) { this.trackKey = trackKey; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInputSummaryJson() { return inputSummaryJson; }
    public void setInputSummaryJson(String inputSummaryJson) { this.inputSummaryJson = inputSummaryJson; }
    public String getExternalResourceId() { return externalResourceId; }
    public void setExternalResourceId(String externalResourceId) { this.externalResourceId = externalResourceId; }
    public String getExternalUrl() { return externalUrl; }
    public void setExternalUrl(String externalUrl) { this.externalUrl = externalUrl; }
    public String getSafeError() { return safeError; }
    public void setSafeError(String safeError) { this.safeError = safeError; }
    public boolean isManualActionRequired() { return manualActionRequired; }
    public void setManualActionRequired(boolean manualActionRequired) { this.manualActionRequired = manualActionRequired; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

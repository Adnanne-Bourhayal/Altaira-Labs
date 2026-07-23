package com.altaira.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "provisioning_plans",
        uniqueConstraints = @UniqueConstraint(
                name = "provisioning_plans_assessment_unique",
                columnNames = {"assessment_id"}
        )
)
public class ProvisioningPlanEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lead_id", nullable = false)
    private LeadEntity lead;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id", nullable = false)
    private LeadAssessmentEntity assessment;

    @Column(name = "route_key", nullable = false, length = 60)
    private String routeKey;

    @Column(name = "automation_level", nullable = false, length = 4)
    private String automationLevel;

    @Column(name = "automation_scope", nullable = false, length = 20)
    private String automationScope;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "dry_run", nullable = false)
    private boolean dryRun;

    @Column(name = "normalized_requirements_json", nullable = false, columnDefinition = "TEXT")
    private String normalizedRequirementsJson;

    @Column(name = "decision_reason", nullable = false, columnDefinition = "TEXT")
    private String decisionReason;

    @Column(name = "risks_json", nullable = false, columnDefinition = "TEXT")
    private String risksJson;

    @Column(name = "cost_estimate", nullable = false, columnDefinition = "TEXT")
    private String costEstimate;

    @Column(name = "tracks_json", nullable = false, columnDefinition = "TEXT")
    private String tracksJson = "[]";

    @Column(name = "shared_resources_json", nullable = false, columnDefinition = "TEXT")
    private String sharedResourcesJson = "[]";

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
    public LeadEntity getLead() { return lead; }
    public void setLead(LeadEntity lead) { this.lead = lead; }
    public LeadAssessmentEntity getAssessment() { return assessment; }
    public void setAssessment(LeadAssessmentEntity assessment) { this.assessment = assessment; }
    public String getRouteKey() { return routeKey; }
    public void setRouteKey(String routeKey) { this.routeKey = routeKey; }
    public String getAutomationLevel() { return automationLevel; }
    public void setAutomationLevel(String automationLevel) { this.automationLevel = automationLevel; }
    public String getAutomationScope() { return automationScope; }
    public void setAutomationScope(String automationScope) { this.automationScope = automationScope; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isDryRun() { return dryRun; }
    public void setDryRun(boolean dryRun) { this.dryRun = dryRun; }
    public String getNormalizedRequirementsJson() { return normalizedRequirementsJson; }
    public void setNormalizedRequirementsJson(String normalizedRequirementsJson) { this.normalizedRequirementsJson = normalizedRequirementsJson; }
    public String getDecisionReason() { return decisionReason; }
    public void setDecisionReason(String decisionReason) { this.decisionReason = decisionReason; }
    public String getRisksJson() { return risksJson; }
    public void setRisksJson(String risksJson) { this.risksJson = risksJson; }
    public String getCostEstimate() { return costEstimate; }
    public void setCostEstimate(String costEstimate) { this.costEstimate = costEstimate; }
    public String getTracksJson() { return tracksJson; }
    public void setTracksJson(String tracksJson) { this.tracksJson = tracksJson; }
    public String getSharedResourcesJson() { return sharedResourcesJson; }
    public void setSharedResourcesJson(String sharedResourcesJson) { this.sharedResourcesJson = sharedResourcesJson; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

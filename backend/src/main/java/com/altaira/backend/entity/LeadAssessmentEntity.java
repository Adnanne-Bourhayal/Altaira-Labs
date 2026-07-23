package com.altaira.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "lead_assessments",
        uniqueConstraints = @UniqueConstraint(
                name = "lead_assessments_lead_form_unique",
                columnNames = {"lead_id", "form_key"}
        )
)
public class LeadAssessmentEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lead_id", nullable = false)
    private LeadEntity lead;

    @Column(name = "form_key", nullable = false, length = 40)
    private String formKey;

    @Column(name = "schema_version", nullable = false)
    private int schemaVersion;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "responses_json", nullable = false, columnDefinition = "TEXT")
    private String responsesJson;

    @Column(name = "recommended_services_json", nullable = false, columnDefinition = "TEXT")
    private String recommendedServicesJson;

    @Column(name = "qualification_summary", nullable = false, columnDefinition = "TEXT")
    private String qualificationSummary;

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

    public String getFormKey() { return formKey; }
    public void setFormKey(String formKey) { this.formKey = formKey; }

    public int getSchemaVersion() { return schemaVersion; }
    public void setSchemaVersion(int schemaVersion) { this.schemaVersion = schemaVersion; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResponsesJson() { return responsesJson; }
    public void setResponsesJson(String responsesJson) { this.responsesJson = responsesJson; }

    public String getRecommendedServicesJson() { return recommendedServicesJson; }
    public void setRecommendedServicesJson(String recommendedServicesJson) { this.recommendedServicesJson = recommendedServicesJson; }

    public String getQualificationSummary() { return qualificationSummary; }
    public void setQualificationSummary(String qualificationSummary) { this.qualificationSummary = qualificationSummary; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

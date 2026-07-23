package com.altaira.backend.dto.lead;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class LeadAssessmentResponse {
    private UUID id;
    private UUID leadId;
    private String formKey;
    private int schemaVersion;
    private String status;
    private Map<String, Object> responses;
    private List<String> recommendedServiceKeys;
    private String qualificationSummary;
    private Instant createdAt;
    private Instant updatedAt;

    public LeadAssessmentResponse() {}

    public LeadAssessmentResponse(
            UUID id,
            UUID leadId,
            String formKey,
            int schemaVersion,
            String status,
            Map<String, Object> responses,
            List<String> recommendedServiceKeys,
            String qualificationSummary,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.leadId = leadId;
        this.formKey = formKey;
        this.schemaVersion = schemaVersion;
        this.status = status;
        this.responses = responses;
        this.recommendedServiceKeys = recommendedServiceKeys;
        this.qualificationSummary = qualificationSummary;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getLeadId() { return leadId; }
    public void setLeadId(UUID leadId) { this.leadId = leadId; }
    public String getFormKey() { return formKey; }
    public void setFormKey(String formKey) { this.formKey = formKey; }
    public int getSchemaVersion() { return schemaVersion; }
    public void setSchemaVersion(int schemaVersion) { this.schemaVersion = schemaVersion; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Map<String, Object> getResponses() { return responses; }
    public void setResponses(Map<String, Object> responses) { this.responses = responses; }
    public List<String> getRecommendedServiceKeys() { return recommendedServiceKeys; }
    public void setRecommendedServiceKeys(List<String> recommendedServiceKeys) { this.recommendedServiceKeys = recommendedServiceKeys; }
    public String getQualificationSummary() { return qualificationSummary; }
    public void setQualificationSummary(String qualificationSummary) { this.qualificationSummary = qualificationSummary; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

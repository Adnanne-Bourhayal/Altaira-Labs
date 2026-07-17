package com.altaira.backend.dto.onboarding;

import java.time.Instant;
import java.util.UUID;

public class OnboardingTaskResponse {
    private UUID id;
    private UUID clientId;
    private UUID clientServiceId;
    private String serviceKey;
    private String sectorType;
    private String taskKey;
    private String title;
    private String description;
    private String taskType;
    private String status;
    private boolean required;
    private boolean critical;
    private int sortOrder;
    private String dataJson;
    private String fileMetadataJson;
    private String signatureFullName;
    private String signatureDocumentId;
    private boolean signatureConsent;
    private String adminFeedback;
    private Instant submittedAt;
    private Instant approvedAt;
    private Instant rejectedAt;
    private Instant completedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public OnboardingTaskResponse() {}

    public OnboardingTaskResponse(
            UUID id,
            UUID clientId,
            UUID clientServiceId,
            String serviceKey,
            String sectorType,
            String taskKey,
            String title,
            String description,
            String taskType,
            String status,
            boolean required,
            boolean critical,
            int sortOrder,
            String dataJson,
            String fileMetadataJson,
            String signatureFullName,
            String signatureDocumentId,
            boolean signatureConsent,
            String adminFeedback,
            Instant submittedAt,
            Instant approvedAt,
            Instant rejectedAt,
            Instant completedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.clientId = clientId;
        this.clientServiceId = clientServiceId;
        this.serviceKey = serviceKey;
        this.sectorType = sectorType;
        this.taskKey = taskKey;
        this.title = title;
        this.description = description;
        this.taskType = taskType;
        this.status = status;
        this.required = required;
        this.critical = critical;
        this.sortOrder = sortOrder;
        this.dataJson = dataJson;
        this.fileMetadataJson = fileMetadataJson;
        this.signatureFullName = signatureFullName;
        this.signatureDocumentId = signatureDocumentId;
        this.signatureConsent = signatureConsent;
        this.adminFeedback = adminFeedback;
        this.submittedAt = submittedAt;
        this.approvedAt = approvedAt;
        this.rejectedAt = rejectedAt;
        this.completedAt = completedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public UUID getClientServiceId() { return clientServiceId; }
    public void setClientServiceId(UUID clientServiceId) { this.clientServiceId = clientServiceId; }

    public String getServiceKey() { return serviceKey; }
    public void setServiceKey(String serviceKey) { this.serviceKey = serviceKey; }

    public String getSectorType() { return sectorType; }
    public void setSectorType(String sectorType) { this.sectorType = sectorType; }

    public String getTaskKey() { return taskKey; }
    public void setTaskKey(String taskKey) { this.taskKey = taskKey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public boolean isCritical() { return critical; }
    public void setCritical(boolean critical) { this.critical = critical; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public String getDataJson() { return dataJson; }
    public void setDataJson(String dataJson) { this.dataJson = dataJson; }

    public String getFileMetadataJson() { return fileMetadataJson; }
    public void setFileMetadataJson(String fileMetadataJson) { this.fileMetadataJson = fileMetadataJson; }

    public String getSignatureFullName() { return signatureFullName; }
    public void setSignatureFullName(String signatureFullName) { this.signatureFullName = signatureFullName; }

    public String getSignatureDocumentId() { return signatureDocumentId; }
    public void setSignatureDocumentId(String signatureDocumentId) { this.signatureDocumentId = signatureDocumentId; }

    public boolean isSignatureConsent() { return signatureConsent; }
    public void setSignatureConsent(boolean signatureConsent) { this.signatureConsent = signatureConsent; }

    public String getAdminFeedback() { return adminFeedback; }
    public void setAdminFeedback(String adminFeedback) { this.adminFeedback = adminFeedback; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public Instant getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(Instant rejectedAt) { this.rejectedAt = rejectedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

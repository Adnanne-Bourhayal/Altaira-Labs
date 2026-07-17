package com.altaira.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "onboarding_tasks")
public class OnboardingTaskEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ClientWorkspaceEntity workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_service_id")
    private ClientServiceEntity clientService;

    @Column(name = "service_key", nullable = false, length = 80)
    private String serviceKey = "general";

    @Column(name = "sector_type", nullable = false, length = 80)
    private String sectorType = "custom";

    @Column(name = "task_key", nullable = false, length = 120)
    private String taskKey;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "task_type", nullable = false, length = 40)
    private String taskType;

    @Column(nullable = false, length = 40)
    private String status = "pending";

    @Column(nullable = false)
    private boolean required = true;

    @Column(nullable = false)
    private boolean critical = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 100;

    @Column(name = "data_json", nullable = false, columnDefinition = "TEXT")
    private String dataJson = "{}";

    @Column(name = "file_metadata_json", nullable = false, columnDefinition = "TEXT")
    private String fileMetadataJson = "[]";

    @Column(name = "signature_full_name")
    private String signatureFullName;

    @Column(name = "signature_document_id")
    private String signatureDocumentId;

    @Column(name = "signature_consent", nullable = false)
    private boolean signatureConsent = false;

    @Column(name = "signed_ip", length = 80)
    private String signedIp;

    @Column(name = "signed_user_agent", length = 500)
    private String signedUserAgent;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "signed_pdf_storage_key")
    private String signedPdfStorageKey;

    @Column(name = "admin_feedback", columnDefinition = "TEXT")
    private String adminFeedback;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

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

    public ClientWorkspaceEntity getWorkspace() { return workspace; }
    public void setWorkspace(ClientWorkspaceEntity workspace) { this.workspace = workspace; }

    public ClientEntity getClient() { return client; }
    public void setClient(ClientEntity client) { this.client = client; }

    public ClientServiceEntity getClientService() { return clientService; }
    public void setClientService(ClientServiceEntity clientService) { this.clientService = clientService; }

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

    public String getSignedIp() { return signedIp; }
    public void setSignedIp(String signedIp) { this.signedIp = signedIp; }

    public String getSignedUserAgent() { return signedUserAgent; }
    public void setSignedUserAgent(String signedUserAgent) { this.signedUserAgent = signedUserAgent; }

    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }

    public String getSignedPdfStorageKey() { return signedPdfStorageKey; }
    public void setSignedPdfStorageKey(String signedPdfStorageKey) { this.signedPdfStorageKey = signedPdfStorageKey; }

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

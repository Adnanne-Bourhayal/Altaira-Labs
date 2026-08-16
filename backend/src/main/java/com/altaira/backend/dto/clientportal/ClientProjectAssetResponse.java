package com.altaira.backend.dto.clientportal;

import java.time.Instant;
import java.util.UUID;

public class ClientProjectAssetResponse {
    private UUID id;
    private UUID projectId;
    private UUID clientId;
    private String assetType;
    private String notes;
    private String originalFilename;
    private String contentType;
    private long sizeBytes;
    private String checksumSha256;
    private String externalUrl;
    private String status;
    private String adminFeedback;
    private Instant uploadedAt;
    private Instant reviewedAt;

    public ClientProjectAssetResponse() {}

    public ClientProjectAssetResponse(
            UUID id,
            UUID projectId,
            UUID clientId,
            String assetType,
            String notes,
            String originalFilename,
            String contentType,
            long sizeBytes,
            String checksumSha256,
            String externalUrl,
            String status,
            String adminFeedback,
            Instant uploadedAt,
            Instant reviewedAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.clientId = clientId;
        this.assetType = assetType;
        this.notes = notes;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.checksumSha256 = checksumSha256;
        this.externalUrl = externalUrl;
        this.status = status;
        this.adminFeedback = adminFeedback;
        this.uploadedAt = uploadedAt;
        this.reviewedAt = reviewedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }

    public String getChecksumSha256() { return checksumSha256; }
    public void setChecksumSha256(String checksumSha256) { this.checksumSha256 = checksumSha256; }

    public String getExternalUrl() { return externalUrl; }
    public void setExternalUrl(String externalUrl) { this.externalUrl = externalUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAdminFeedback() { return adminFeedback; }
    public void setAdminFeedback(String adminFeedback) { this.adminFeedback = adminFeedback; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }

    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
}

package com.altaira.backend.dto.onboarding;

import java.time.Instant;
import java.util.UUID;

public class OnboardingFileResponse {
    private UUID id;
    private UUID taskId;
    private UUID clientId;
    private String originalFilename;
    private String contentType;
    private long sizeBytes;
    private String checksumSha256;
    private Instant createdAt;

    public OnboardingFileResponse() {}

    public OnboardingFileResponse(
            UUID id,
            UUID taskId,
            UUID clientId,
            String originalFilename,
            String contentType,
            long sizeBytes,
            String checksumSha256,
            Instant createdAt
    ) {
        this.id = id;
        this.taskId = taskId;
        this.clientId = clientId;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.checksumSha256 = checksumSha256;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }

    public String getChecksumSha256() { return checksumSha256; }
    public void setChecksumSha256(String checksumSha256) { this.checksumSha256 = checksumSha256; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

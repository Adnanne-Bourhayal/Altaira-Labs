package com.altaira.backend.dto.media;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class CompletePrivateUploadRequest {

    @NotBlank(message = "bucket is required")
    @Size(max = 255, message = "bucket must be 255 characters or fewer")
    private String bucket;

    @NotBlank(message = "objectKey is required")
    @Size(max = 700, message = "objectKey must be 700 characters or fewer")
    private String objectKey;

    @NotBlank(message = "filename is required")
    @Size(max = 180, message = "filename must be 180 characters or fewer")
    private String filename;

    @Size(max = 120, message = "contentType must be 120 characters or fewer")
    private String contentType;

    @Positive(message = "sizeBytes must be greater than zero")
    @Max(value = 15728640, message = "file must be 15 MB or smaller")
    private long sizeBytes;

    @Size(max = 80, message = "assetType must be 80 characters or fewer")
    private String assetType;

    @Size(max = 2000, message = "notes must be 2000 characters or fewer")
    private String notes;

    public String getBucket() { return bucket; }
    public void setBucket(String bucket) { this.bucket = bucket; }

    public String getObjectKey() { return objectKey; }
    public void setObjectKey(String objectKey) { this.objectKey = objectKey; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

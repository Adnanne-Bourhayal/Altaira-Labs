package com.altaira.backend.dto.media;

import java.time.Instant;
import java.util.Map;

public class UploadUrlResponse {
    private String method;
    private String uploadUrl;
    private String bucket;
    private String objectKey;
    private String publicUrl;
    private Instant expiresAt;
    private Map<String, String> headers;

    public UploadUrlResponse() {}

    public UploadUrlResponse(
            String method,
            String uploadUrl,
            String bucket,
            String objectKey,
            String publicUrl,
            Instant expiresAt,
            Map<String, String> headers
    ) {
        this.method = method;
        this.uploadUrl = uploadUrl;
        this.bucket = bucket;
        this.objectKey = objectKey;
        this.publicUrl = publicUrl;
        this.expiresAt = expiresAt;
        this.headers = headers;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public void setUploadUrl(String uploadUrl) {
        this.uploadUrl = uploadUrl;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public void setObjectKey(String objectKey) {
        this.objectKey = objectKey;
    }

    public String getPublicUrl() {
        return publicUrl;
    }

    public void setPublicUrl(String publicUrl) {
        this.publicUrl = publicUrl;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }
}

package com.altaira.backend.dto.media;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateUploadUrlRequest {

    @NotBlank(message = "folder is required")
    private String folder;

    @Size(max = 80, message = "serviceKey must be 80 characters or fewer")
    private String serviceKey;

    @NotBlank(message = "filename is required")
    @Size(max = 180, message = "filename must be 180 characters or fewer")
    private String filename;

    @Size(max = 120, message = "contentType must be 120 characters or fewer")
    private String contentType;

    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }

    public String getServiceKey() {
        return serviceKey;
    }

    public void setServiceKey(String serviceKey) {
        this.serviceKey = serviceKey;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}

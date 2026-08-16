package com.altaira.backend.dto.onboarding;

import jakarta.validation.constraints.Size;

import java.util.Map;

public class SubmitOnboardingTaskRequest {

    @Size(max = 120, message = "Signer full name must be at most 120 characters")
    private String signatureFullName;

    @Size(max = 80, message = "Document ID must be at most 80 characters")
    private String signatureDocumentId;

    private boolean signatureConsent;

    private Map<String, Object> data;

    private java.util.List<Map<String, Object>> files;

    public String getSignatureFullName() { return signatureFullName; }
    public void setSignatureFullName(String signatureFullName) { this.signatureFullName = signatureFullName; }

    public String getSignatureDocumentId() { return signatureDocumentId; }
    public void setSignatureDocumentId(String signatureDocumentId) { this.signatureDocumentId = signatureDocumentId; }

    public boolean isSignatureConsent() { return signatureConsent; }
    public void setSignatureConsent(boolean signatureConsent) { this.signatureConsent = signatureConsent; }

    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    public java.util.List<Map<String, Object>> getFiles() { return files; }
    public void setFiles(java.util.List<Map<String, Object>> files) { this.files = files; }
}

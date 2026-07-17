package com.altaira.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GoogleClientLoginRequest {

    @NotBlank(message = "Google credential is required")
    @Size(max = 5000, message = "Google credential must be at most 5000 characters")
    private String credential;

    public String getCredential() { return credential; }
    public void setCredential(String credential) { this.credential = credential; }
}

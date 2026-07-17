package com.altaira.backend.dto.clientportal;

import jakarta.validation.constraints.Size;

public class UpdateClientProjectRequest {

    @Size(max = 180, message = "Project name must be at most 180 characters")
    private String name;

    @Size(max = 40, message = "Project phase must be at most 40 characters")
    private String currentPhase;

    @Size(max = 500, message = "Staging URL must be at most 500 characters")
    private String stagingUrl;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(String currentPhase) { this.currentPhase = currentPhase; }

    public String getStagingUrl() { return stagingUrl; }
    public void setStagingUrl(String stagingUrl) { this.stagingUrl = stagingUrl; }
}

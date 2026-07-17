package com.altaira.backend.dto.clientportal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateClientProjectConfigSnapshotRequest {

    @NotBlank(message = "Snapshot label is required")
    @Size(max = 180, message = "Snapshot label must be at most 180 characters")
    private String label;

    @NotBlank(message = "Artifact type is required")
    @Size(max = 120, message = "Artifact type must be at most 120 characters")
    private String artifactType;

    @NotBlank(message = "Configuration JSON is required")
    @Size(max = 50000, message = "Configuration JSON must be at most 50000 characters")
    private String configJson;

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getArtifactType() { return artifactType; }
    public void setArtifactType(String artifactType) { this.artifactType = artifactType; }

    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
}

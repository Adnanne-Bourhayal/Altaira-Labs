package com.altaira.backend.dto.lead;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public class SaveLeadAssessmentRequest {

    @NotNull(message = "Assessment responses are required")
    private Map<String, Object> responses;

    @Size(max = 20, message = "Assessment status must be at most 20 characters")
    private String status;

    @Min(value = 1, message = "Assessment schema version must be at least 1")
    @Max(value = 2, message = "Assessment schema version is not supported")
    private Integer schemaVersion;

    public Map<String, Object> getResponses() { return responses; }
    public void setResponses(Map<String, Object> responses) { this.responses = responses; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getSchemaVersion() { return schemaVersion; }
    public void setSchemaVersion(Integer schemaVersion) { this.schemaVersion = schemaVersion; }
}

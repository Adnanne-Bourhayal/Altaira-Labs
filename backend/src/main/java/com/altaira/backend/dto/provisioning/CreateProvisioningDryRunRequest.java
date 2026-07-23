package com.altaira.backend.dto.provisioning;

import java.util.UUID;

public class CreateProvisioningDryRunRequest {
    private UUID assessmentId;

    public UUID getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(UUID assessmentId) {
        this.assessmentId = assessmentId;
    }
}

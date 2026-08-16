package com.altaira.backend.dto.provisioning;

import jakarta.validation.constraints.NotBlank;

public class UpdateProvisioningPlanStatusRequest {

    @NotBlank
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

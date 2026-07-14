package com.altaira.backend.dto.lead;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateLeadStatusRequest {

    @NotBlank(message = "Lead status is required")
    @Size(max = 20, message = "Lead status must be at most 20 characters")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

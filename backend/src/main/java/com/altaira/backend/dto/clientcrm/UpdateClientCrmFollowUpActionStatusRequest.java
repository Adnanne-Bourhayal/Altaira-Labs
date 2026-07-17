package com.altaira.backend.dto.clientcrm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateClientCrmFollowUpActionStatusRequest {

    @NotBlank(message = "Follow-up action status is required")
    @Size(max = 40, message = "Follow-up action status must be at most 40 characters")
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

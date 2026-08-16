package com.altaira.backend.dto.clientservice;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateClientServiceStatusRequest {

    @NotBlank(message = "Client service status is required")
    @Size(max = 20, message = "Client service status must be at most 20 characters")
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

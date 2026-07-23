package com.altaira.backend.dto.workspacetask;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateWorkspaceTaskStatusRequest {

    @NotBlank(message = "Task status is required")
    @Size(max = 40)
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

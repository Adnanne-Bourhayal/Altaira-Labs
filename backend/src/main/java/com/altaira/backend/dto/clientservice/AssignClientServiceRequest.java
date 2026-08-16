package com.altaira.backend.dto.clientservice;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class AssignClientServiceRequest {

    @NotNull(message = "Service id is required")
    private UUID serviceId;

    @Size(max = 20, message = "Client service status must be at most 20 characters")
    private String status;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes;

    public UUID getServiceId() { return serviceId; }
    public void setServiceId(UUID serviceId) { this.serviceId = serviceId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

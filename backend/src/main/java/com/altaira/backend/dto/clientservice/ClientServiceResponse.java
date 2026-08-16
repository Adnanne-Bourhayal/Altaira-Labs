package com.altaira.backend.dto.clientservice;

import com.altaira.backend.dto.service.ServiceResponse;

import java.time.Instant;
import java.util.UUID;

public class ClientServiceResponse {

    private UUID id;
    private UUID clientId;
    private ServiceResponse service;
    private String status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public ClientServiceResponse() {}

    public ClientServiceResponse(UUID id, UUID clientId, ServiceResponse service, String status, String notes, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.clientId = clientId;
        this.service = service;
        this.status = status;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public ServiceResponse getService() { return service; }
    public void setService(ServiceResponse service) { this.service = service; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

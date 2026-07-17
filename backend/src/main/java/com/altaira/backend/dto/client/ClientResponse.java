package com.altaira.backend.dto.client;

import java.time.Instant;
import java.util.UUID;

public class ClientResponse {

    private UUID id;
    private String name;
    private String company;
    private String email;
    private String phone;
    private UUID sourceLeadId;
    private String status;
    private String sectorType;
    private Instant createdAt;
    private Instant updatedAt;

    public ClientResponse() {}

    public ClientResponse(UUID id, String name, String company, String email, String phone, UUID sourceLeadId, String status, String sectorType, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.company = company;
        this.email = email;
        this.phone = phone;
        this.sourceLeadId = sourceLeadId;
        this.status = status;
        this.sectorType = sectorType;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public UUID getSourceLeadId() { return sourceLeadId; }
    public void setSourceLeadId(UUID sourceLeadId) { this.sourceLeadId = sourceLeadId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSectorType() { return sectorType; }
    public void setSectorType(String sectorType) { this.sectorType = sectorType; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

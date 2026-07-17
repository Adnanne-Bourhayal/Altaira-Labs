package com.altaira.backend.dto.client;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class CreateClientRequest {

    @NotBlank(message = "Client name is required")
    @Size(min = 2, max = 120, message = "Client name must be between 2 and 120 characters")
    private String name;

    @NotBlank(message = "Company is required")
    @Size(min = 2, max = 120, message = "Company must be between 2 and 120 characters")
    private String company;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @Size(max = 40, message = "Phone must be at most 40 characters")
    private String phone;

    private UUID sourceLeadId;

    @Size(max = 20, message = "Client status must be at most 20 characters")
    private String status;

    @Size(max = 40, message = "Sector type must be at most 40 characters")
    private String sectorType;

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
}

package com.altaira.backend.dto.service;

import java.time.Instant;
import java.util.UUID;

public class ServiceResponse {

    private UUID id;
    private String name;
    private String category;
    private String description;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public ServiceResponse() {}

    public ServiceResponse(UUID id, String name, String category, String description, boolean active, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.description = description;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

package com.altaira.backend.dto.service;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateServiceRequest {

    @NotBlank(message = "Service name is required")
    @Size(min = 2, max = 120, message = "Service name must be between 2 and 120 characters")
    private String name;

    @Size(max = 80, message = "Category must be at most 80 characters")
    private String category;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    private Boolean active;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}

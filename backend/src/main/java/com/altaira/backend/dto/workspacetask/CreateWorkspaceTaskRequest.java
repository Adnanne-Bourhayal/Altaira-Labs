package com.altaira.backend.dto.workspacetask;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public class CreateWorkspaceTaskRequest {

    @NotNull(message = "Client is required")
    private UUID clientId;

    private UUID clientServiceId;
    private UUID projectId;

    @NotBlank(message = "Task title is required")
    @Size(max = 240, message = "Task title must be at most 240 characters")
    private String title;

    @Size(max = 4000, message = "Task description must be at most 4000 characters")
    private String description;

    @Size(max = 40)
    private String status;

    @Size(max = 24)
    private String priority;

    @Size(max = 24)
    private String ownerRole;

    @Size(max = 32)
    private String visibility;

    private Instant dueAt;

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public UUID getClientServiceId() { return clientServiceId; }
    public void setClientServiceId(UUID clientServiceId) { this.clientServiceId = clientServiceId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getOwnerRole() { return ownerRole; }
    public void setOwnerRole(String ownerRole) { this.ownerRole = ownerRole; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }

    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
}

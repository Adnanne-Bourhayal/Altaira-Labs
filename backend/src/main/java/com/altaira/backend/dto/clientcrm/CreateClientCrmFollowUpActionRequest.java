package com.altaira.backend.dto.clientcrm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class CreateClientCrmFollowUpActionRequest {

    @NotBlank(message = "Follow-up action title is required")
    @Size(max = 180, message = "Follow-up action title must be at most 180 characters")
    private String title;

    @Size(max = 1200, message = "Follow-up action description must be at most 1200 characters")
    private String description;

    private Boolean visibleToClient;

    private Instant dueAt;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getVisibleToClient() { return visibleToClient; }
    public void setVisibleToClient(Boolean visibleToClient) { this.visibleToClient = visibleToClient; }

    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
}

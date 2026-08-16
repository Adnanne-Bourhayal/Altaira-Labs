package com.altaira.backend.dto.clientcrm;

import java.time.Instant;
import java.util.UUID;

public class ClientCrmLeadNoteResponse {
    private UUID id;
    private UUID leadId;
    private String content;
    private String authorUsername;
    private String authorRole;
    private boolean visibleToClient;
    private Instant createdAt;

    public ClientCrmLeadNoteResponse() {}

    public ClientCrmLeadNoteResponse(
            UUID id,
            UUID leadId,
            String content,
            String authorUsername,
            String authorRole,
            boolean visibleToClient,
            Instant createdAt
    ) {
        this.id = id;
        this.leadId = leadId;
        this.content = content;
        this.authorUsername = authorUsername;
        this.authorRole = authorRole;
        this.visibleToClient = visibleToClient;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getLeadId() { return leadId; }
    public void setLeadId(UUID leadId) { this.leadId = leadId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getAuthorRole() { return authorRole; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    public boolean isVisibleToClient() { return visibleToClient; }
    public void setVisibleToClient(boolean visibleToClient) { this.visibleToClient = visibleToClient; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

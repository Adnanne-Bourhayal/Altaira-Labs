package com.altaira.backend.dto.note;

import java.time.Instant;
import java.util.UUID;

public class InternalNoteResponse {

    private UUID id;
    private UUID leadId;
    private UUID clientId;
    private String content;
    private String author;
    private Instant createdAt;

    public InternalNoteResponse() {}

    public InternalNoteResponse(UUID id, UUID leadId, UUID clientId, String content, String author, Instant createdAt) {
        this.id = id;
        this.leadId = leadId;
        this.clientId = clientId;
        this.content = content;
        this.author = author;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getLeadId() { return leadId; }
    public void setLeadId(UUID leadId) { this.leadId = leadId; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

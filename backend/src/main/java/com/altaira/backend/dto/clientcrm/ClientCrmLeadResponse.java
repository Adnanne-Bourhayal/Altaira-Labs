package com.altaira.backend.dto.clientcrm;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class ClientCrmLeadResponse {
    private UUID id;
    private UUID clientId;
    private String fullName;
    private String email;
    private String phone;
    private String source;
    private String status;
    private String priority;
    private String sectorType;
    private Map<String, String> sectorFields;
    private List<ClientCrmFollowUpActionResponse> followUpActions;
    private List<ClientCrmLeadNoteResponse> notes;
    private List<ClientCrmLeadEventResponse> events;
    private Instant createdAt;
    private Instant updatedAt;

    public ClientCrmLeadResponse() {}

    public ClientCrmLeadResponse(
            UUID id,
            UUID clientId,
            String fullName,
            String email,
            String phone,
            String source,
            String status,
            String priority,
            String sectorType,
            Map<String, String> sectorFields,
            List<ClientCrmFollowUpActionResponse> followUpActions,
            List<ClientCrmLeadNoteResponse> notes,
            List<ClientCrmLeadEventResponse> events,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.clientId = clientId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.source = source;
        this.status = status;
        this.priority = priority;
        this.sectorType = sectorType;
        this.sectorFields = sectorFields;
        this.followUpActions = followUpActions;
        this.notes = notes;
        this.events = events;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getSectorType() { return sectorType; }
    public void setSectorType(String sectorType) { this.sectorType = sectorType; }

    public Map<String, String> getSectorFields() { return sectorFields; }
    public void setSectorFields(Map<String, String> sectorFields) { this.sectorFields = sectorFields; }

    public List<ClientCrmFollowUpActionResponse> getFollowUpActions() { return followUpActions; }
    public void setFollowUpActions(List<ClientCrmFollowUpActionResponse> followUpActions) { this.followUpActions = followUpActions; }

    public List<ClientCrmLeadNoteResponse> getNotes() { return notes; }
    public void setNotes(List<ClientCrmLeadNoteResponse> notes) { this.notes = notes; }

    public List<ClientCrmLeadEventResponse> getEvents() { return events; }
    public void setEvents(List<ClientCrmLeadEventResponse> events) { this.events = events; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

package com.altaira.backend.dto.clientportal;

import java.util.UUID;

public class ClientPortalModuleResponse {
    private String moduleKey;
    private String title;
    private String description;
    private boolean active;
    private boolean locked;
    private String status;
    private UUID clientServiceId;
    private String serviceName;

    public ClientPortalModuleResponse() {}

    public ClientPortalModuleResponse(
            String moduleKey,
            String title,
            String description,
            boolean active,
            boolean locked,
            String status,
            UUID clientServiceId,
            String serviceName
    ) {
        this.moduleKey = moduleKey;
        this.title = title;
        this.description = description;
        this.active = active;
        this.locked = locked;
        this.status = status;
        this.clientServiceId = clientServiceId;
        this.serviceName = serviceName;
    }

    public String getModuleKey() { return moduleKey; }
    public void setModuleKey(String moduleKey) { this.moduleKey = moduleKey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getClientServiceId() { return clientServiceId; }
    public void setClientServiceId(UUID clientServiceId) { this.clientServiceId = clientServiceId; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
}

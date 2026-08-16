package com.altaira.backend.dto.clientportal;

import com.altaira.backend.dto.client.ClientResponse;

import java.util.List;
import java.util.UUID;

public class ClientPortalResponse {
    private UUID workspaceId;
    private String workspaceName;
    private String workspaceStatus;
    private ClientResponse client;
    private boolean onboardingCompleted;
    private boolean contractApproved;
    private List<ClientPortalModuleResponse> modules;
    private List<ClientProjectResponse> projects;
    private String accessRole;
    private boolean canEdit;

    public ClientPortalResponse() {}

    public ClientPortalResponse(
            UUID workspaceId,
            String workspaceName,
            String workspaceStatus,
            ClientResponse client,
            boolean onboardingCompleted,
            boolean contractApproved,
            List<ClientPortalModuleResponse> modules,
            List<ClientProjectResponse> projects,
            String accessRole,
            boolean canEdit
    ) {
        this.workspaceId = workspaceId;
        this.workspaceName = workspaceName;
        this.workspaceStatus = workspaceStatus;
        this.client = client;
        this.onboardingCompleted = onboardingCompleted;
        this.contractApproved = contractApproved;
        this.modules = modules;
        this.projects = projects;
        this.accessRole = accessRole;
        this.canEdit = canEdit;
    }

    public UUID getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(UUID workspaceId) { this.workspaceId = workspaceId; }

    public String getWorkspaceName() { return workspaceName; }
    public void setWorkspaceName(String workspaceName) { this.workspaceName = workspaceName; }

    public String getWorkspaceStatus() { return workspaceStatus; }
    public void setWorkspaceStatus(String workspaceStatus) { this.workspaceStatus = workspaceStatus; }

    public ClientResponse getClient() { return client; }
    public void setClient(ClientResponse client) { this.client = client; }

    public boolean isOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }

    public boolean isContractApproved() { return contractApproved; }
    public void setContractApproved(boolean contractApproved) { this.contractApproved = contractApproved; }

    public List<ClientPortalModuleResponse> getModules() { return modules; }
    public void setModules(List<ClientPortalModuleResponse> modules) { this.modules = modules; }

    public List<ClientProjectResponse> getProjects() { return projects; }
    public void setProjects(List<ClientProjectResponse> projects) { this.projects = projects; }

    public String getAccessRole() { return accessRole; }
    public void setAccessRole(String accessRole) { this.accessRole = accessRole; }

    public boolean isCanEdit() { return canEdit; }
    public void setCanEdit(boolean canEdit) { this.canEdit = canEdit; }
}

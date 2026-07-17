package com.altaira.backend.dto.clientportal;

import com.altaira.backend.dto.client.ClientResponse;

import java.util.List;

public class ClientPortalResponse {
    private ClientResponse client;
    private boolean onboardingCompleted;
    private boolean contractApproved;
    private List<ClientPortalModuleResponse> modules;
    private List<ClientProjectResponse> projects;
    private String accessRole;
    private boolean canEdit;

    public ClientPortalResponse() {}

    public ClientPortalResponse(
            ClientResponse client,
            boolean onboardingCompleted,
            boolean contractApproved,
            List<ClientPortalModuleResponse> modules,
            List<ClientProjectResponse> projects,
            String accessRole,
            boolean canEdit
    ) {
        this.client = client;
        this.onboardingCompleted = onboardingCompleted;
        this.contractApproved = contractApproved;
        this.modules = modules;
        this.projects = projects;
        this.accessRole = accessRole;
        this.canEdit = canEdit;
    }

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

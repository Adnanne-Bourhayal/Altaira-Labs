package com.altaira.backend.dto.github;

import jakarta.validation.constraints.Size;

import java.util.List;

public class GitHubProvisioningDryRunRequest {

    @Size(max = 140, message = "Project name must be at most 140 characters")
    private String projectName;

    @Size(max = 140, message = "Client name must be at most 140 characters")
    private String clientName;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    private Boolean privateRepository;
    private List<String> serviceKeys;

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getPrivateRepository() {
        return privateRepository;
    }

    public void setPrivateRepository(Boolean privateRepository) {
        this.privateRepository = privateRepository;
    }

    public List<String> getServiceKeys() {
        return serviceKeys;
    }

    public void setServiceKeys(List<String> serviceKeys) {
        this.serviceKeys = serviceKeys;
    }
}

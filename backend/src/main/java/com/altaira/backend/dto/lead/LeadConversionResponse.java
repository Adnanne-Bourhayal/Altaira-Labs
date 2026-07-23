package com.altaira.backend.dto.lead;

import com.altaira.backend.dto.client.ClientResponse;
import com.altaira.backend.dto.clientportal.ClientProjectResponse;
import com.altaira.backend.dto.clientservice.ClientServiceResponse;

import java.util.List;

public class LeadConversionResponse {
    private LeadResponse lead;
    private ClientResponse client;
    private boolean clientCreated;
    private List<ClientServiceResponse> serviceAssignments;
    private boolean workspaceReady;
    private List<ClientProjectResponse> projects;

    public LeadConversionResponse() {}

    public LeadConversionResponse(
            LeadResponse lead,
            ClientResponse client,
            boolean clientCreated,
            List<ClientServiceResponse> serviceAssignments,
            boolean workspaceReady,
            List<ClientProjectResponse> projects
    ) {
        this.lead = lead;
        this.client = client;
        this.clientCreated = clientCreated;
        this.serviceAssignments = serviceAssignments;
        this.workspaceReady = workspaceReady;
        this.projects = projects;
    }

    public LeadResponse getLead() { return lead; }
    public void setLead(LeadResponse lead) { this.lead = lead; }
    public ClientResponse getClient() { return client; }
    public void setClient(ClientResponse client) { this.client = client; }
    public boolean isClientCreated() { return clientCreated; }
    public void setClientCreated(boolean clientCreated) { this.clientCreated = clientCreated; }
    public List<ClientServiceResponse> getServiceAssignments() { return serviceAssignments; }
    public void setServiceAssignments(List<ClientServiceResponse> serviceAssignments) { this.serviceAssignments = serviceAssignments; }
    public boolean isWorkspaceReady() { return workspaceReady; }
    public void setWorkspaceReady(boolean workspaceReady) { this.workspaceReady = workspaceReady; }
    public List<ClientProjectResponse> getProjects() { return projects; }
    public void setProjects(List<ClientProjectResponse> projects) { this.projects = projects; }
}

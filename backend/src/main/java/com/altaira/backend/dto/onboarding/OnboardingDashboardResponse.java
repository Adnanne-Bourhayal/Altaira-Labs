package com.altaira.backend.dto.onboarding;

import com.altaira.backend.dto.client.ClientResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class OnboardingDashboardResponse {
    private UUID workspaceId;
    private ClientResponse client;
    private String workspaceName;
    private String status;
    private boolean onboardingCompleted;
    private boolean contractSubmitted;
    private boolean contractApproved;
    private int totalRequiredTasks;
    private int completedRequiredTasks;
    private int submittedTasks;
    private int rejectedTasks;
    private Instant contractSubmittedAt;
    private Instant contractApprovedAt;
    private List<OnboardingTaskResponse> tasks;
    private String accessRole;
    private boolean canEdit;

    public OnboardingDashboardResponse() {}

    public OnboardingDashboardResponse(
            UUID workspaceId,
            ClientResponse client,
            String workspaceName,
            String status,
            boolean onboardingCompleted,
            boolean contractSubmitted,
            boolean contractApproved,
            int totalRequiredTasks,
            int completedRequiredTasks,
            int submittedTasks,
            int rejectedTasks,
            Instant contractSubmittedAt,
            Instant contractApprovedAt,
            List<OnboardingTaskResponse> tasks
    ) {
        this.workspaceId = workspaceId;
        this.client = client;
        this.workspaceName = workspaceName;
        this.status = status;
        this.onboardingCompleted = onboardingCompleted;
        this.contractSubmitted = contractSubmitted;
        this.contractApproved = contractApproved;
        this.totalRequiredTasks = totalRequiredTasks;
        this.completedRequiredTasks = completedRequiredTasks;
        this.submittedTasks = submittedTasks;
        this.rejectedTasks = rejectedTasks;
        this.contractSubmittedAt = contractSubmittedAt;
        this.contractApprovedAt = contractApprovedAt;
        this.tasks = tasks;
    }

    public UUID getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(UUID workspaceId) { this.workspaceId = workspaceId; }

    public ClientResponse getClient() { return client; }
    public void setClient(ClientResponse client) { this.client = client; }

    public String getWorkspaceName() { return workspaceName; }
    public void setWorkspaceName(String workspaceName) { this.workspaceName = workspaceName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }

    public boolean isContractSubmitted() { return contractSubmitted; }
    public void setContractSubmitted(boolean contractSubmitted) { this.contractSubmitted = contractSubmitted; }

    public boolean isContractApproved() { return contractApproved; }
    public void setContractApproved(boolean contractApproved) { this.contractApproved = contractApproved; }

    public int getTotalRequiredTasks() { return totalRequiredTasks; }
    public void setTotalRequiredTasks(int totalRequiredTasks) { this.totalRequiredTasks = totalRequiredTasks; }

    public int getCompletedRequiredTasks() { return completedRequiredTasks; }
    public void setCompletedRequiredTasks(int completedRequiredTasks) { this.completedRequiredTasks = completedRequiredTasks; }

    public int getSubmittedTasks() { return submittedTasks; }
    public void setSubmittedTasks(int submittedTasks) { this.submittedTasks = submittedTasks; }

    public int getRejectedTasks() { return rejectedTasks; }
    public void setRejectedTasks(int rejectedTasks) { this.rejectedTasks = rejectedTasks; }

    public Instant getContractSubmittedAt() { return contractSubmittedAt; }
    public void setContractSubmittedAt(Instant contractSubmittedAt) { this.contractSubmittedAt = contractSubmittedAt; }

    public Instant getContractApprovedAt() { return contractApprovedAt; }
    public void setContractApprovedAt(Instant contractApprovedAt) { this.contractApprovedAt = contractApprovedAt; }

    public List<OnboardingTaskResponse> getTasks() { return tasks; }
    public void setTasks(List<OnboardingTaskResponse> tasks) { this.tasks = tasks; }

    public String getAccessRole() { return accessRole; }
    public void setAccessRole(String accessRole) { this.accessRole = accessRole; }

    public boolean isCanEdit() { return canEdit; }
    public void setCanEdit(boolean canEdit) { this.canEdit = canEdit; }
}

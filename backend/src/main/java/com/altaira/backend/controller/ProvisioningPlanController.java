package com.altaira.backend.controller;

import com.altaira.backend.dto.provisioning.CreateProvisioningDryRunRequest;
import com.altaira.backend.dto.provisioning.ProvisioningPlanResponse;
import com.altaira.backend.dto.provisioning.UpdateProvisioningPlanStatusRequest;
import com.altaira.backend.dto.github.ExecuteGitHubRepositoryRequest;
import com.altaira.backend.dto.github.GitHubRepositoryExecutionResponse;
import com.altaira.backend.dto.jira.ExecuteJiraIssuesRequest;
import com.altaira.backend.dto.jira.JiraIssueExecutionResponse;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.service.GitHubProvisioningExecutionService;
import com.altaira.backend.service.JiraProvisioningExecutionService;
import com.altaira.backend.service.ProvisioningPlanService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ProvisioningPlanController {

    private final ProvisioningPlanService provisioningPlanService;
    private final GitHubProvisioningExecutionService githubProvisioningExecutionService;
    private final JiraProvisioningExecutionService jiraProvisioningExecutionService;
    private final AdminAccessService adminAccessService;

    public ProvisioningPlanController(
            ProvisioningPlanService provisioningPlanService,
            GitHubProvisioningExecutionService githubProvisioningExecutionService,
            JiraProvisioningExecutionService jiraProvisioningExecutionService,
            AdminAccessService adminAccessService
    ) {
        this.provisioningPlanService = provisioningPlanService;
        this.githubProvisioningExecutionService = githubProvisioningExecutionService;
        this.jiraProvisioningExecutionService = jiraProvisioningExecutionService;
        this.adminAccessService = adminAccessService;
    }

    @PostMapping("/leads/{leadId}/provisioning-plans/dry-run")
    public ProvisioningPlanResponse generateDryRun(
            @PathVariable UUID leadId,
            @RequestBody(required = false) CreateProvisioningDryRunRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return provisioningPlanService.generateDryRun(leadId, request);
    }

    @GetMapping("/leads/{leadId}/provisioning-plans")
    public List<ProvisioningPlanResponse> getPlans(
            @PathVariable UUID leadId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return provisioningPlanService.getPlansForLead(leadId);
    }

    @GetMapping("/provisioning-plans/{planId}")
    public ProvisioningPlanResponse getPlan(
            @PathVariable UUID planId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return provisioningPlanService.getPlan(planId);
    }

    @PatchMapping("/provisioning-plans/{planId}/status")
    public ProvisioningPlanResponse updateStatus(
            @PathVariable UUID planId,
            @Valid @RequestBody UpdateProvisioningPlanStatusRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return provisioningPlanService.updateStatus(planId, request.getStatus());
    }

    @PostMapping("/provisioning-plans/{planId}/providers/github/repository")
    public GitHubRepositoryExecutionResponse executeGitHubRepository(
            @PathVariable UUID planId,
            @Valid @RequestBody ExecuteGitHubRepositoryRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return githubProvisioningExecutionService.executePrivateRepository(planId, request);
    }

    @PostMapping("/provisioning-plans/{planId}/providers/jira/issues")
    public JiraIssueExecutionResponse executeJiraIssues(
            @PathVariable UUID planId,
            @Valid @RequestBody ExecuteJiraIssuesRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return jiraProvisioningExecutionService.executeIssues(planId, request);
    }
}

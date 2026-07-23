package com.altaira.backend.controller;

import com.altaira.backend.dto.github.GitHubIntegrationStatusResponse;
import com.altaira.backend.dto.github.GitHubProvisioningDryRunRequest;
import com.altaira.backend.dto.github.GitHubProvisioningPlanResponse;
import com.altaira.backend.integration.github.GitHubIntegrationStatusService;
import com.altaira.backend.integration.github.GitHubProvisioningService;
import com.altaira.backend.security.AdminAccessService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/integrations/github")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class GitHubIntegrationController {

    private final AdminAccessService adminAccessService;
    private final GitHubIntegrationStatusService statusService;
    private final GitHubProvisioningService provisioningService;

    public GitHubIntegrationController(
            AdminAccessService adminAccessService,
            GitHubIntegrationStatusService statusService,
            GitHubProvisioningService provisioningService
    ) {
        this.adminAccessService = adminAccessService;
        this.statusService = statusService;
        this.provisioningService = provisioningService;
    }

    @GetMapping("/status")
    public GitHubIntegrationStatusResponse status(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return statusService.getStatus();
    }

    @PostMapping("/provisioning/dry-run")
    public GitHubProvisioningPlanResponse dryRun(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken,
            @Valid @RequestBody(required = false) GitHubProvisioningDryRunRequest request
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return provisioningService.dryRun(request);
    }
}

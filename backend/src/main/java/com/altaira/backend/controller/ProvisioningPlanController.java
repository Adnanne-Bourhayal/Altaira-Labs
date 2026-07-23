package com.altaira.backend.controller;

import com.altaira.backend.dto.provisioning.CreateProvisioningDryRunRequest;
import com.altaira.backend.dto.provisioning.ProvisioningPlanResponse;
import com.altaira.backend.dto.provisioning.UpdateProvisioningPlanStatusRequest;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.service.ProvisioningPlanService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ProvisioningPlanController {

    private final ProvisioningPlanService provisioningPlanService;
    private final AdminAccessService adminAccessService;

    public ProvisioningPlanController(
            ProvisioningPlanService provisioningPlanService,
            AdminAccessService adminAccessService
    ) {
        this.provisioningPlanService = provisioningPlanService;
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
}

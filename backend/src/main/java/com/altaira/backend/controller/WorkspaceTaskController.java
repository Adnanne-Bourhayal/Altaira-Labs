package com.altaira.backend.controller;

import com.altaira.backend.dto.workspacetask.CreateWorkspaceTaskRequest;
import com.altaira.backend.dto.workspacetask.UpdateWorkspaceTaskRequest;
import com.altaira.backend.dto.workspacetask.WorkspaceTaskResponse;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.security.ClientAccessService;
import com.altaira.backend.service.WorkspaceTaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspace-tasks")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://localhost:3001",
        "https://altairalabs.vercel.app"
})
public class WorkspaceTaskController {

    private final AdminAccessService adminAccessService;
    private final ClientAccessService clientAccessService;
    private final WorkspaceTaskService workspaceTaskService;

    public WorkspaceTaskController(
            AdminAccessService adminAccessService,
            ClientAccessService clientAccessService,
            WorkspaceTaskService workspaceTaskService
    ) {
        this.adminAccessService = adminAccessService;
        this.clientAccessService = clientAccessService;
        this.workspaceTaskService = workspaceTaskService;
    }

    @GetMapping("/admin")
    public List<WorkspaceTaskResponse> listForAdmin(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return workspaceTaskService.listForAdmin();
    }

    @GetMapping("/admin/clients/{clientId}/preview")
    public List<WorkspaceTaskResponse> listForAdminClientPreview(
            @PathVariable UUID clientId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return workspaceTaskService.listForAdminClientPreview(clientId);
    }

    @PostMapping("/admin")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceTaskResponse createForAdmin(
            @Valid @RequestBody CreateWorkspaceTaskRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        var adminUser = adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return workspaceTaskService.createForAdmin(request, adminUser);
    }

    @PatchMapping("/admin/{taskId}")
    public WorkspaceTaskResponse updateForAdmin(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateWorkspaceTaskRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return workspaceTaskService.updateForAdmin(taskId, request);
    }

    @DeleteMapping("/admin/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteForAdmin(
            @PathVariable UUID taskId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        workspaceTaskService.deleteForAdmin(taskId);
    }

    @GetMapping("/client/me")
    public List<WorkspaceTaskResponse> listForClient(
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        return workspaceTaskService.listForClient(context);
    }

    @PatchMapping("/client/{taskId}/status")
    public void updateStatusForClient(
            @PathVariable UUID taskId,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        clientAccessService.requireClientAccess(clientSessionToken);
        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Client task management is read-only. Submit a service-track suggestion for Altaira review."
        );
    }
}

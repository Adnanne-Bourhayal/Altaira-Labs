package com.altaira.backend.controller;

import com.altaira.backend.dto.clientservice.ClientServiceResponse;
import com.altaira.backend.dto.clientservice.UpdateClientServiceStatusRequest;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.service.ClientServiceAssignmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/client-services")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class ClientServiceController {

    private final ClientServiceAssignmentService clientServiceAssignmentService;
    private final AdminAccessService adminAccessService;

    public ClientServiceController(
            ClientServiceAssignmentService clientServiceAssignmentService,
            AdminAccessService adminAccessService
    ) {
        this.clientServiceAssignmentService = clientServiceAssignmentService;
        this.adminAccessService = adminAccessService;
    }

    @PatchMapping("/{id}/status")
    public ClientServiceResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClientServiceStatusRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientServiceAssignmentService.updateStatus(id, request.getStatus());
    }
}

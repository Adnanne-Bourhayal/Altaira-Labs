package com.altaira.backend.controller;

import com.altaira.backend.dto.clientservice.ClientServiceResponse;
import com.altaira.backend.dto.clientservice.UpdateClientServiceStatusRequest;
import com.altaira.backend.security.InternalApiTokenService;
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
    private final InternalApiTokenService internalApiTokenService;

    public ClientServiceController(
            ClientServiceAssignmentService clientServiceAssignmentService,
            InternalApiTokenService internalApiTokenService
    ) {
        this.clientServiceAssignmentService = clientServiceAssignmentService;
        this.internalApiTokenService = internalApiTokenService;
    }

    @PatchMapping("/{id}/status")
    public ClientServiceResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClientServiceStatusRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return clientServiceAssignmentService.updateStatus(id, request.getStatus());
    }
}

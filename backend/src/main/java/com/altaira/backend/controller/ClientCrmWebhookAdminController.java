package com.altaira.backend.controller;

import com.altaira.backend.dto.clientcrm.ClientCrmWebhookTokenResponse;
import com.altaira.backend.dto.clientcrm.CreateClientCrmWebhookTokenRequest;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.service.ClientCrmWebhookTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/client-crm/admin/clients/{clientId}/webhook-tokens")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class ClientCrmWebhookAdminController {

    private final AdminAccessService adminAccessService;
    private final ClientCrmWebhookTokenService tokenService;

    public ClientCrmWebhookAdminController(
            AdminAccessService adminAccessService,
            ClientCrmWebhookTokenService tokenService
    ) {
        this.adminAccessService = adminAccessService;
        this.tokenService = tokenService;
    }

    @GetMapping
    public List<ClientCrmWebhookTokenResponse> listTokens(
            @PathVariable UUID clientId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return tokenService.listTokens(clientId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientCrmWebhookTokenResponse createToken(
            @PathVariable UUID clientId,
            @Valid @RequestBody(required = false) CreateClientCrmWebhookTokenRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return tokenService.createToken(clientId, request);
    }

    @PatchMapping("/{tokenId}/revoke")
    public ClientCrmWebhookTokenResponse revokeToken(
            @PathVariable UUID clientId,
            @PathVariable UUID tokenId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return tokenService.revokeToken(clientId, tokenId);
    }
}

package com.altaira.backend.controller;

import com.altaira.backend.dto.clientcrm.AddClientCrmLeadNoteRequest;
import com.altaira.backend.dto.clientcrm.ClientCrmLeadResponse;
import com.altaira.backend.dto.clientcrm.CreateClientCrmFollowUpActionRequest;
import com.altaira.backend.dto.clientcrm.CreateClientCrmLeadRequest;
import com.altaira.backend.dto.clientcrm.UpdateClientCrmFollowUpActionStatusRequest;
import com.altaira.backend.dto.clientcrm.UpdateClientCrmLeadStatusRequest;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.security.ClientAccessService;
import com.altaira.backend.service.ClientCrmLeadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/client-crm")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class ClientCrmLeadController {

    private final ClientAccessService clientAccessService;
    private final AdminAccessService adminAccessService;
    private final ClientCrmLeadService clientCrmLeadService;

    public ClientCrmLeadController(
            ClientAccessService clientAccessService,
            AdminAccessService adminAccessService,
            ClientCrmLeadService clientCrmLeadService
    ) {
        this.clientAccessService = clientAccessService;
        this.adminAccessService = adminAccessService;
        this.clientCrmLeadService = clientCrmLeadService;
    }

    @GetMapping("/client/leads")
    public List<ClientCrmLeadResponse> listClientLeads(
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        return clientCrmLeadService.listClientLeads(context);
    }

    @GetMapping("/client/leads/{leadId}")
    public ClientCrmLeadResponse getClientLead(
            @PathVariable UUID leadId,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        return clientCrmLeadService.getClientLead(context, leadId);
    }

    @PostMapping("/client/leads")
    @ResponseStatus(HttpStatus.CREATED)
    public ClientCrmLeadResponse createClientLead(
            @Valid @RequestBody CreateClientCrmLeadRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return clientCrmLeadService.createClientLead(context, request);
    }

    @PatchMapping("/client/leads/{leadId}/status")
    public ClientCrmLeadResponse updateClientLeadStatus(
            @PathVariable UUID leadId,
            @Valid @RequestBody UpdateClientCrmLeadStatusRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return clientCrmLeadService.updateClientLeadStatus(context, leadId, request);
    }

    @PostMapping("/client/leads/{leadId}/notes")
    public ClientCrmLeadResponse addClientLeadNote(
            @PathVariable UUID leadId,
            @Valid @RequestBody AddClientCrmLeadNoteRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return clientCrmLeadService.addClientLeadNote(context, leadId, request);
    }

    @PostMapping("/client/leads/{leadId}/follow-up-actions")
    public ClientCrmLeadResponse createClientFollowUpAction(
            @PathVariable UUID leadId,
            @Valid @RequestBody CreateClientCrmFollowUpActionRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return clientCrmLeadService.createClientFollowUpAction(context, leadId, request);
    }

    @PatchMapping("/client/leads/{leadId}/follow-up-actions/{actionId}/status")
    public ClientCrmLeadResponse updateClientFollowUpActionStatus(
            @PathVariable UUID leadId,
            @PathVariable UUID actionId,
            @Valid @RequestBody UpdateClientCrmFollowUpActionStatusRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return clientCrmLeadService.updateClientFollowUpActionStatus(context, leadId, actionId, request);
    }

    @GetMapping("/admin/clients/{clientId}/leads")
    public List<ClientCrmLeadResponse> listClientLeadsAsAdmin(
            @PathVariable UUID clientId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientCrmLeadService.listClientLeadsAsAdmin(clientId);
    }

    @PatchMapping("/admin/clients/{clientId}/leads/{leadId}/status")
    public ClientCrmLeadResponse updateClientLeadStatusAsAdmin(
            @PathVariable UUID clientId,
            @PathVariable UUID leadId,
            @Valid @RequestBody UpdateClientCrmLeadStatusRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        var adminUser = adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientCrmLeadService.updateClientLeadStatusAsAdmin(clientId, leadId, adminUser, request);
    }

    @PostMapping("/admin/clients/{clientId}/leads/{leadId}/notes")
    public ClientCrmLeadResponse addClientLeadNoteAsAdmin(
            @PathVariable UUID clientId,
            @PathVariable UUID leadId,
            @Valid @RequestBody AddClientCrmLeadNoteRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        var adminUser = adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientCrmLeadService.addClientLeadNoteAsAdmin(clientId, leadId, adminUser, request);
    }

    @PostMapping("/admin/clients/{clientId}/leads/{leadId}/follow-up-actions")
    public ClientCrmLeadResponse createFollowUpActionAsAdmin(
            @PathVariable UUID clientId,
            @PathVariable UUID leadId,
            @Valid @RequestBody CreateClientCrmFollowUpActionRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        var adminUser = adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientCrmLeadService.createFollowUpActionAsAdmin(clientId, leadId, adminUser, request);
    }

    @PatchMapping("/admin/clients/{clientId}/leads/{leadId}/follow-up-actions/{actionId}/status")
    public ClientCrmLeadResponse updateFollowUpActionStatusAsAdmin(
            @PathVariable UUID clientId,
            @PathVariable UUID leadId,
            @PathVariable UUID actionId,
            @Valid @RequestBody UpdateClientCrmFollowUpActionStatusRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        var adminUser = adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientCrmLeadService.updateFollowUpActionStatusAsAdmin(clientId, leadId, actionId, adminUser, request);
    }
}

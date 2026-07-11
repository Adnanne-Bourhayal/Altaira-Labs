package com.altaira.backend.controller;

import com.altaira.backend.dto.client.ClientResponse;
import com.altaira.backend.dto.client.CreateClientRequest;
import com.altaira.backend.dto.clientservice.AssignClientServiceRequest;
import com.altaira.backend.dto.clientservice.ClientServiceResponse;
import com.altaira.backend.dto.note.CreateInternalNoteRequest;
import com.altaira.backend.dto.note.InternalNoteResponse;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.service.ClientManagementService;
import com.altaira.backend.service.ClientServiceAssignmentService;
import com.altaira.backend.service.InternalNoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clients")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class ClientController {

    private final ClientManagementService clientManagementService;
    private final ClientServiceAssignmentService clientServiceAssignmentService;
    private final InternalNoteService internalNoteService;
    private final AdminAccessService adminAccessService;

    public ClientController(
            ClientManagementService clientManagementService,
            ClientServiceAssignmentService clientServiceAssignmentService,
            InternalNoteService internalNoteService,
            AdminAccessService adminAccessService
    ) {
        this.clientManagementService = clientManagementService;
        this.clientServiceAssignmentService = clientServiceAssignmentService;
        this.internalNoteService = internalNoteService;
        this.adminAccessService = adminAccessService;
    }

    @GetMapping
    public List<ClientResponse> getAllClients(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientManagementService.getAllClients();
    }

    @GetMapping("/{id}")
    public ClientResponse getClientById(
            @PathVariable UUID id,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientManagementService.getClientById(id);
    }

    @PostMapping
    public ResponseEntity<ClientResponse> createClient(
            @Valid @RequestBody CreateClientRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(clientManagementService.createClient(request));
    }

    @PostMapping("/from-lead/{leadId}")
    public ClientResponse createClientFromLead(
            @PathVariable UUID leadId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientManagementService.createClientFromLead(leadId);
    }

    @GetMapping("/{clientId}/services")
    public List<ClientServiceResponse> getClientServices(
            @PathVariable UUID clientId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientServiceAssignmentService.getClientServices(clientId);
    }

    @PostMapping("/{clientId}/services")
    public ResponseEntity<ClientServiceResponse> assignService(
            @PathVariable UUID clientId,
            @Valid @RequestBody AssignClientServiceRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(clientServiceAssignmentService.assignService(clientId, request));
    }

    @GetMapping("/{clientId}/notes")
    public List<InternalNoteResponse> getClientNotes(
            @PathVariable UUID clientId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return internalNoteService.getClientNotes(clientId);
    }

    @PostMapping("/{clientId}/notes")
    public ResponseEntity<InternalNoteResponse> addClientNote(
            @PathVariable UUID clientId,
            @Valid @RequestBody CreateInternalNoteRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(internalNoteService.addClientNote(clientId, request));
    }
}

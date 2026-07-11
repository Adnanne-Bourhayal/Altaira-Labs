package com.altaira.backend.controller;

import com.altaira.backend.dto.note.CreateInternalNoteRequest;
import com.altaira.backend.dto.note.InternalNoteResponse;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.service.InternalNoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class InternalNoteController {

    private final InternalNoteService internalNoteService;
    private final AdminAccessService adminAccessService;

    public InternalNoteController(InternalNoteService internalNoteService, AdminAccessService adminAccessService) {
        this.internalNoteService = internalNoteService;
        this.adminAccessService = adminAccessService;
    }

    @GetMapping("/api/v1/leads/{leadId}/notes")
    public List<InternalNoteResponse> getLeadNotes(
            @PathVariable UUID leadId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return internalNoteService.getLeadNotes(leadId);
    }

    @PostMapping("/api/v1/leads/{leadId}/notes")
    public ResponseEntity<InternalNoteResponse> addLeadNote(
            @PathVariable UUID leadId,
            @Valid @RequestBody CreateInternalNoteRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(internalNoteService.addLeadNote(leadId, request));
    }
}

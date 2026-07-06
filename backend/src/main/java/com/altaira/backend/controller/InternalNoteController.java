package com.altaira.backend.controller;

import com.altaira.backend.dto.note.CreateInternalNoteRequest;
import com.altaira.backend.dto.note.InternalNoteResponse;
import com.altaira.backend.security.InternalApiTokenService;
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
    private final InternalApiTokenService internalApiTokenService;

    public InternalNoteController(InternalNoteService internalNoteService, InternalApiTokenService internalApiTokenService) {
        this.internalNoteService = internalNoteService;
        this.internalApiTokenService = internalApiTokenService;
    }

    @GetMapping("/api/v1/leads/{leadId}/notes")
    public List<InternalNoteResponse> getLeadNotes(
            @PathVariable UUID leadId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return internalNoteService.getLeadNotes(leadId);
    }

    @PostMapping("/api/v1/leads/{leadId}/notes")
    public ResponseEntity<InternalNoteResponse> addLeadNote(
            @PathVariable UUID leadId,
            @Valid @RequestBody CreateInternalNoteRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(internalNoteService.addLeadNote(leadId, request));
    }
}

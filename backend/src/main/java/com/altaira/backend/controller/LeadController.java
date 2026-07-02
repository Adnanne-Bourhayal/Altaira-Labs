package com.altaira.backend.controller;

import com.altaira.backend.dto.lead.CreateLeadRequest;
import com.altaira.backend.dto.lead.LeadResponse;
import com.altaira.backend.dto.lead.UpdateLeadStatusRequest;
import com.altaira.backend.security.InternalApiTokenService;
import com.altaira.backend.security.RateLimiterService;
import com.altaira.backend.service.LeadService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leads")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class LeadController {

    private final LeadService leadService;
    private final RateLimiterService rateLimiterService;
    private final InternalApiTokenService internalApiTokenService;

    public LeadController(
            LeadService leadService,
            RateLimiterService rateLimiterService,
            InternalApiTokenService internalApiTokenService
    ) {
        this.leadService = leadService;
        this.rateLimiterService = rateLimiterService;
        this.internalApiTokenService = internalApiTokenService;
    }

    @GetMapping
    public List<LeadResponse> getAllLeads(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return leadService.getAllLeads();
    }

    @GetMapping("/{id}")
    public LeadResponse getLeadById(
            @PathVariable UUID id,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return leadService.getLeadById(id);
    }

    @PatchMapping("/{id}/status")
    public LeadResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLeadStatusRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return leadService.updateStatus(id, request.getStatus());
    }

    @PostMapping
    public ResponseEntity<?> createLead(@Valid @RequestBody CreateLeadRequest request, HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        Bucket bucket = rateLimiterService.resolveBucket(ip);

        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Too many requests",
                    "message", "Rate limit exceeded. Try again later."
            ));
        }

        LeadResponse createdLead = leadService.createLead(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdLead);
    }
}

package com.altaira.backend.controller;

import com.altaira.backend.dto.lead.CreateLeadRequest;
import com.altaira.backend.dto.lead.LeadResponse;
import com.altaira.backend.service.LeadService;
import com.altaira.backend.security.RateLimiterService;

import io.github.bucket4j.Bucket;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leads")
@CrossOrigin(origins = {
        "http://localhost:3000"
})
public class LeadController {

    private final LeadService leadService;
    private final RateLimiterService rateLimiterService;

    public LeadController(LeadService leadService, RateLimiterService rateLimiterService) {
        this.leadService = leadService;
        this.rateLimiterService = rateLimiterService;
    }

    private boolean isAuthorizedInternalRequest(HttpServletRequest request) {
        String providedToken = request.getHeader("X-Internal-API-Token");
        String expectedToken = System.getenv("INTERNAL_API_TOKEN");

        return expectedToken != null && expectedToken.equals(providedToken);
    }

    @GetMapping
    public ResponseEntity<?> getAllLeads(HttpServletRequest request) {
        if (!isAuthorizedInternalRequest(request)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        List<LeadResponse> leads = leadService.getAllLeads();
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLeadById(@PathVariable UUID id, HttpServletRequest request) {
        if (!isAuthorizedInternalRequest(request)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        LeadResponse lead = leadService.getLeadById(id);
        return ResponseEntity.ok(lead);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {
        if (!isAuthorizedInternalRequest(request)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String status = body.get("status");
        LeadResponse updated = leadService.updateStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @PostMapping
    public ResponseEntity<?> createLead(
            @Valid @RequestBody CreateLeadRequest request,
            HttpServletRequest httpRequest
    ) {
        String ip = httpRequest.getRemoteAddr();
        Bucket bucket = rateLimiterService.resolveBucket(ip);

        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Too many requests",
                    "message", "Rate limit exceeded. Try again later."
            ));
        }

        if (request.getWebsite() != null && !request.getWebsite().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Bot detected",
                    "message", "Invalid form submission."
            ));
        }

        LeadResponse createdLead = leadService.createLead(request);
        return ResponseEntity.ok(createdLead);
    }
}

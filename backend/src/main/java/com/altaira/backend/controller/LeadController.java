package com.altaira.backend.controller;

import com.altaira.backend.dto.lead.CreateLeadRequest;
import com.altaira.backend.dto.lead.CreateAdminLeadIntakeRequest;
import com.altaira.backend.dto.lead.LeadAssessmentResponse;
import com.altaira.backend.dto.lead.LeadConversionRequest;
import com.altaira.backend.dto.lead.LeadConversionResponse;
import com.altaira.backend.dto.lead.LeadIntakeResponse;
import com.altaira.backend.dto.lead.LeadResponse;
import com.altaira.backend.dto.lead.SaveLeadAssessmentRequest;
import com.altaira.backend.dto.lead.UpdateLeadStatusRequest;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.security.RateLimiterService;
import com.altaira.backend.service.LeadService;
import com.altaira.backend.service.LeadAssessmentService;
import com.altaira.backend.service.LeadConversionService;
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
    private final LeadAssessmentService leadAssessmentService;
    private final LeadConversionService leadConversionService;
    private final RateLimiterService rateLimiterService;
    private final AdminAccessService adminAccessService;

    public LeadController(
            LeadService leadService,
            LeadAssessmentService leadAssessmentService,
            LeadConversionService leadConversionService,
            RateLimiterService rateLimiterService,
            AdminAccessService adminAccessService
    ) {
        this.leadService = leadService;
        this.leadAssessmentService = leadAssessmentService;
        this.leadConversionService = leadConversionService;
        this.rateLimiterService = rateLimiterService;
        this.adminAccessService = adminAccessService;
    }

    @PostMapping("/admin-intake")
    public ResponseEntity<LeadIntakeResponse> createAdminIntake(
            @Valid @RequestBody CreateAdminLeadIntakeRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(leadAssessmentService.createAdminIntake(request));
    }

    @GetMapping
    public List<LeadResponse> getAllLeads(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return leadService.getAllLeads();
    }

    @GetMapping("/{id}")
    public LeadResponse getLeadById(
            @PathVariable UUID id,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return leadService.getLeadById(id);
    }

    @GetMapping("/{id}/assessments")
    public List<LeadAssessmentResponse> getAssessments(
            @PathVariable UUID id,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return leadAssessmentService.getAssessments(id);
    }

    @PutMapping("/{id}/assessments/{formKey}")
    public LeadAssessmentResponse saveAssessment(
            @PathVariable UUID id,
            @PathVariable String formKey,
            @Valid @RequestBody SaveLeadAssessmentRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return leadAssessmentService.saveAssessment(id, formKey, request);
    }

    @PostMapping("/{id}/convert")
    public LeadConversionResponse convertLead(
            @PathVariable UUID id,
            @Valid @RequestBody LeadConversionRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return leadConversionService.convert(id, request);
    }

    @PatchMapping("/{id}/status")
    public LeadResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLeadStatusRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
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

package com.altaira.backend.controller;

import com.altaira.backend.dto.commercial.CommercialFlowResponse;
import com.altaira.backend.dto.commercial.CreateCheckoutRequest;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.service.CommercialFlowService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class CommercialFlowController {
    private final CommercialFlowService commercialFlowService;
    private final AdminAccessService adminAccessService;

    public CommercialFlowController(CommercialFlowService commercialFlowService, AdminAccessService adminAccessService) {
        this.commercialFlowService = commercialFlowService;
        this.adminAccessService = adminAccessService;
    }

    @GetMapping("/provisioning-plans/{planId}/commercial-flow")
    public CommercialFlowResponse getFlow(
            @PathVariable UUID planId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminToken
    ) {
        adminAccessService.requireAdminAccess(internalToken, adminToken);
        return commercialFlowService.getFlow(planId);
    }

    @PostMapping("/provisioning-plans/{planId}/payments/checkout")
    public CommercialFlowResponse createCheckout(
            @PathVariable UUID planId,
            @Valid @RequestBody CreateCheckoutRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminToken
    ) {
        adminAccessService.requireAdminAccess(internalToken, adminToken);
        return commercialFlowService.createCheckout(planId, request);
    }

    @PostMapping("/provisioning-plans/{planId}/payments/mock-confirm")
    public CommercialFlowResponse confirmMock(
            @PathVariable UUID planId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminToken
    ) {
        adminAccessService.requireAdminAccess(internalToken, adminToken);
        return commercialFlowService.confirmMock(planId);
    }

    @PostMapping("/provisioning-plans/{planId}/commercial-flow/retry")
    public CommercialFlowResponse retryActivation(
            @PathVariable UUID planId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminToken
    ) {
        adminAccessService.requireAdminAccess(internalToken, adminToken);
        return commercialFlowService.retryActivation(planId);
    }

    @PostMapping("/provisioning-plans/{planId}/commercial-flow/notifications/retry")
    public CommercialFlowResponse retryNotifications(
            @PathVariable UUID planId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminToken
    ) {
        adminAccessService.requireAdminAccess(internalToken, adminToken);
        return commercialFlowService.retryNotifications(planId);
    }

    @PostMapping("/payments/stripe/webhook")
    public ResponseEntity<Map<String, Boolean>> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader(name = "Stripe-Signature") String signature
    ) {
        commercialFlowService.processStripeWebhook(payload, signature);
        return ResponseEntity.ok(Map.of("received", true));
    }
}

package com.altaira.backend;

import com.altaira.backend.entity.CommercialFlowEntity;
import com.altaira.backend.entity.CommercialPaymentSessionEntity;
import com.altaira.backend.entity.LeadAssessmentEntity;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import com.altaira.backend.model.ProvisioningPlanStatus;
import com.altaira.backend.repository.ClientRepository;
import com.altaira.backend.repository.ClientWorkspaceRepository;
import com.altaira.backend.repository.CommercialFlowRepository;
import com.altaira.backend.repository.CommercialPaymentEventRepository;
import com.altaira.backend.repository.CommercialPaymentSessionRepository;
import com.altaira.backend.repository.LeadAssessmentRepository;
import com.altaira.backend.repository.LeadRepository;
import com.altaira.backend.repository.ProvisioningPlanRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:commercial_endpoint_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "altaira.commercial.legacy-direct-conversion-enabled=false",
        "altaira.commercial.stripe.enabled=false",
        "altaira.commercial.stripe.mode=mock",
        "altaira.commercial.stripe.webhook-secret=whsec_test_commercial_endpoint",
        "altaira.commercial.stripe.mock-confirmation-enabled=true",
        "altaira.commercial.email.enabled=false",
        "altaira.onboarding.email.enabled=false",
        "contact.email.enabled=false",
        "altaira.github.app.enabled=false",
        "altaira.github.provisioning.enabled=false",
        "altaira.github.dry-run=true"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CommercialFlowEndpointTests {
    private static final String INTERNAL_TOKEN = "test-internal-token";
    private static final String WEBHOOK_SECRET = "whsec_test_commercial_endpoint";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private LeadRepository leadRepository;
    @Autowired private LeadAssessmentRepository assessmentRepository;
    @Autowired private ProvisioningPlanRepository planRepository;
    @Autowired private CommercialFlowRepository flowRepository;
    @Autowired private CommercialPaymentSessionRepository paymentSessionRepository;
    @Autowired private CommercialPaymentEventRepository paymentEventRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private ClientWorkspaceRepository workspaceRepository;

    @Test
    void commercialEndpointsEnforceApprovalValidationAuthenticationAndSignedWebhook() throws Exception {
        ProvisioningPlanEntity draftPlan = plan(ProvisioningPlanStatus.DRAFT);

        mockMvc.perform(get("/api/v1/provisioning-plans/{planId}/commercial-flow", draftPlan.getId()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/provisioning-plans/{planId}/payments/checkout", draftPlan.getId())
                        .header("X-Internal-API-Token", INTERNAL_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutBody(150000)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Provisioning plan must be approved before payment"));

        ProvisioningPlanEntity approvedPlan = plan(ProvisioningPlanStatus.APPROVED);

        mockMvc.perform(post("/api/v1/provisioning-plans/{planId}/payments/checkout", approvedPlan.getId())
                        .header("X-Internal-API-Token", INTERNAL_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutBody(99)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.amountMinor").value("Payment amount must be at least 1.00"));

        mockMvc.perform(post("/api/v1/provisioning-plans/{planId}/payments/checkout", approvedPlan.getId())
                        .header("X-Internal-API-Token", INTERNAL_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutBody(150000)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mockMode").value(true))
                .andExpect(jsonPath("$.paymentStatus").value("PAYMENT_PENDING"))
                .andExpect(jsonPath("$.clientStatus").value("CLIENT_DRAFT"))
                .andExpect(jsonPath("$.workspaceStatus").value("WORKSPACE_PENDING"));

        assertThat(clientRepository.count()).isZero();
        assertThat(workspaceRepository.count()).isZero();

        mockMvc.perform(post("/api/v1/payments/stripe/webhook")
                        .header("Stripe-Signature", "t=1,v1=invalid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid Stripe webhook signature"));

        CommercialFlowEntity flow = flowRepository.findByPlan(approvedPlan).orElseThrow();
        CommercialPaymentSessionEntity session = paymentSessionRepository
                .findAllByFlowOrderByCreatedAtDesc(flow)
                .getFirst();
        String eventId = "evt_endpoint_" + UUID.randomUUID().toString().replace("-", "");
        String payload = webhookPayload(eventId, session.getProviderSessionId());
        String signature = stripeSignature(payload);

        mockMvc.perform(post("/api/v1/payments/stripe/webhook")
                        .header("Stripe-Signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.received").value(true));

        mockMvc.perform(post("/api/v1/payments/stripe/webhook")
                        .header("Stripe-Signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.received").value(true));

        mockMvc.perform(get("/api/v1/provisioning-plans/{planId}/commercial-flow", approvedPlan.getId())
                        .header("X-Internal-API-Token", INTERNAL_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAYMENT_CONFIRMED"))
                .andExpect(jsonPath("$.clientStatus").value("CLIENT_ACTIVE"))
                .andExpect(jsonPath("$.workspaceStatus").value("WORKSPACE_ACTIVE"))
                .andExpect(jsonPath("$.provisioningRun.dryRun").value(true))
                .andExpect(jsonPath("$.emailDeliveries.length()").value(3));

        mockMvc.perform(post("/api/v1/provisioning-plans/{planId}/commercial-flow/notifications/retry", approvedPlan.getId()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/provisioning-plans/{planId}/commercial-flow/notifications/retry", approvedPlan.getId())
                        .header("X-Internal-API-Token", INTERNAL_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailDeliveries.length()").value(3));

        assertThat(clientRepository.count()).isEqualTo(1);
        assertThat(workspaceRepository.count()).isEqualTo(1);
        assertThat(paymentEventRepository.count()).isEqualTo(1);
    }

    @Test
    void unpaidFailedAndExpiredStripeEventsNeverActivateAClient() throws Exception {
        ProvisioningPlanEntity failedPlan = plan(ProvisioningPlanStatus.APPROVED);
        createCheckout(failedPlan);
        CommercialPaymentSessionEntity failedSession = latestSession(failedPlan);

        sendWebhook(webhookPayload(
                "evt_unpaid_" + UUID.randomUUID().toString().replace("-", ""),
                "checkout.session.completed",
                failedSession.getProviderSessionId(),
                "unpaid"
        ));

        assertFlowStatus(failedPlan, "PAYMENT_PENDING");
        assertThat(clientRepository.count()).isZero();
        assertThat(workspaceRepository.count()).isZero();

        sendWebhook(webhookPayload(
                "evt_failed_" + UUID.randomUUID().toString().replace("-", ""),
                "checkout.session.async_payment_failed",
                failedSession.getProviderSessionId(),
                "unpaid"
        ));

        assertFlowStatus(failedPlan, "PAYMENT_FAILED");
        assertThat(clientRepository.count()).isZero();
        assertThat(workspaceRepository.count()).isZero();
        UUID failedSessionId = failedSession.getId();

        createCheckout(failedPlan);
        CommercialPaymentSessionEntity retrySession = latestSession(failedPlan);
        assertThat(retrySession.getId()).isNotEqualTo(failedSessionId);
        assertThat(paymentSessionRepository.findAllByFlowOrderByCreatedAtDesc(
                flowRepository.findByPlan(failedPlan).orElseThrow()
        )).hasSize(2);
        assertFlowStatus(failedPlan, "PAYMENT_PENDING");
        assertThat(clientRepository.count()).isZero();
        assertThat(workspaceRepository.count()).isZero();

        ProvisioningPlanEntity expiredPlan = plan(ProvisioningPlanStatus.APPROVED);
        createCheckout(expiredPlan);
        CommercialPaymentSessionEntity expiredSession = latestSession(expiredPlan);

        sendWebhook(webhookPayload(
                "evt_expired_" + UUID.randomUUID().toString().replace("-", ""),
                "checkout.session.expired",
                expiredSession.getProviderSessionId(),
                "unpaid"
        ));

        assertFlowStatus(expiredPlan, "PAYMENT_CANCELLED");
        assertThat(clientRepository.count()).isZero();
        assertThat(workspaceRepository.count()).isZero();
        assertThat(paymentEventRepository.count()).isEqualTo(3);
    }

    private void createCheckout(ProvisioningPlanEntity plan) throws Exception {
        mockMvc.perform(post("/api/v1/provisioning-plans/{planId}/payments/checkout", plan.getId())
                        .header("X-Internal-API-Token", INTERNAL_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutBody(150000)))
                .andExpect(status().isOk());
    }

    private CommercialPaymentSessionEntity latestSession(ProvisioningPlanEntity plan) {
        CommercialFlowEntity flow = flowRepository.findByPlan(plan).orElseThrow();
        return paymentSessionRepository.findAllByFlowOrderByCreatedAtDesc(flow).getFirst();
    }

    private void sendWebhook(String payload) throws Exception {
        mockMvc.perform(post("/api/v1/payments/stripe/webhook")
                        .header("Stripe-Signature", stripeSignature(payload))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.received").value(true));
    }

    private void assertFlowStatus(ProvisioningPlanEntity plan, String paymentStatus) throws Exception {
        mockMvc.perform(get("/api/v1/provisioning-plans/{planId}/commercial-flow", plan.getId())
                        .header("X-Internal-API-Token", INTERNAL_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value(paymentStatus))
                .andExpect(jsonPath("$.clientStatus").value("CLIENT_DRAFT"))
                .andExpect(jsonPath("$.workspaceStatus").value("WORKSPACE_PENDING"));
    }

    private ProvisioningPlanEntity plan(ProvisioningPlanStatus status) throws Exception {
        String suffix = UUID.randomUUID().toString();
        LeadEntity lead = new LeadEntity();
        lead.setFullName("Endpoint Test Owner");
        lead.setBusinessName("Endpoint Test Company " + suffix);
        lead.setEmail("endpoint-" + suffix + "@example.com");
        lead.setPhone("+32 470 00 00 00");
        lead.setIndustry("Clinics");
        lead.setServiceInterest("Web and CRM");
        lead.setGoals("Verify the HTTP payment boundary.");
        lead.setStatus("qualified");
        lead.setCreatedAt(Instant.now());
        lead = leadRepository.saveAndFlush(lead);

        LeadAssessmentEntity assessment = new LeadAssessmentEntity();
        assessment.setLead(lead);
        assessment.setFormKey("general");
        assessment.setSchemaVersion(1);
        assessment.setStatus("reviewed");
        assessment.setResponsesJson("{}");
        assessment.setRecommendedServicesJson("[\"web_seo\",\"crm\"]");
        assessment.setQualificationSummary("HTTP endpoint test fixture.");
        assessment = assessmentRepository.saveAndFlush(assessment);

        ProvisioningPlanEntity plan = new ProvisioningPlanEntity();
        plan.setLead(lead);
        plan.setAssessment(assessment);
        plan.setRouteKey("COMPOSITE");
        plan.setAutomationLevel("A1");
        plan.setAutomationScope("controlled");
        plan.setStatus(status.value());
        plan.setDryRun(true);
        plan.setNormalizedRequirementsJson("{\"requires_crm\":true}");
        plan.setDecisionReason("Isolated H2 endpoint fixture.");
        plan.setRisksJson("[]");
        plan.setCostEstimate("Test only");
        plan.setTracksJson(objectMapper.writeValueAsString(List.of(track("WEB"), track("CRM"))));
        plan.setSharedResourcesJson("[]");
        return planRepository.saveAndFlush(plan);
    }

    private Map<String, Object> track(String key) {
        return Map.ofEntries(
                Map.entry("track", key),
                Map.entry("route", "PROVISION_" + key + "_TEST"),
                Map.entry("ruleId", "endpoint-test"),
                Map.entry("matchedSignals", List.of("test")),
                Map.entry("reason", "Endpoint test track"),
                Map.entry("confidence", 1.0),
                Map.entry("requiresManualDecision", false),
                Map.entry("automationLevel", "A1"),
                Map.entry("tools", List.of()),
                Map.entry("manualSteps", List.of()),
                Map.entry("risks", List.of())
        );
    }

    private String checkoutBody(long amountMinor) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "amountMinor", amountMinor,
                "currency", "EUR",
                "description", "Commercial endpoint test"
        ));
    }

    private String webhookPayload(String eventId, String sessionId) throws Exception {
        return webhookPayload(eventId, "checkout.session.completed", sessionId, "paid");
    }

    private String webhookPayload(String eventId, String eventType, String sessionId, String paymentStatus) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "id", eventId,
                "object", "event",
                "type", eventType,
                "data", Map.of("object", Map.of(
                        "id", sessionId,
                        "object", "checkout.session",
                        "payment_status", paymentStatus,
                        "payment_intent", "pi_test_only"
                ))
        ));
    }

    private String stripeSignature(String payload) throws Exception {
        long timestamp = Instant.now().getEpochSecond();
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal((timestamp + "." + payload).getBytes(StandardCharsets.UTF_8));
        return "t=" + timestamp + ",v1=" + HexFormat.of().formatHex(digest);
    }
}

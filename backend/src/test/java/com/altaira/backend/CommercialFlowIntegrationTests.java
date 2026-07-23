package com.altaira.backend;

import com.altaira.backend.dto.commercial.CommercialFlowResponse;
import com.altaira.backend.dto.commercial.CreateCheckoutRequest;
import com.altaira.backend.dto.lead.LeadConversionRequest;
import com.altaira.backend.entity.*;
import com.altaira.backend.model.ProvisioningPlanStatus;
import com.altaira.backend.repository.*;
import com.altaira.backend.service.CommercialFlowService;
import com.altaira.backend.service.LeadConversionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:commercial_flow_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "altaira.commercial.legacy-direct-conversion-enabled=false",
        "altaira.commercial.stripe.enabled=false",
        "altaira.commercial.stripe.mode=mock",
        "altaira.commercial.stripe.webhook-secret=whsec_test_commercial_flow",
        "altaira.commercial.stripe.mock-confirmation-enabled=true",
        "altaira.commercial.email.enabled=false",
        "altaira.onboarding.email.enabled=false",
        "contact.email.enabled=false",
        "altaira.github.app.enabled=false",
        "altaira.github.provisioning.enabled=false",
        "altaira.github.dry-run=true"
})
@ActiveProfiles("test")
class CommercialFlowIntegrationTests {
    private static final String WEBHOOK_SECRET = "whsec_test_commercial_flow";

    @Autowired private CommercialFlowService commercialFlowService;
    @Autowired private LeadConversionService leadConversionService;
    @Autowired private LeadRepository leadRepository;
    @Autowired private LeadAssessmentRepository assessmentRepository;
    @Autowired private ProvisioningPlanRepository planRepository;
    @Autowired private ProvisioningPlanItemRepository planItemRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private ClientWorkspaceRepository workspaceRepository;
    @Autowired private ClientInvitationRepository invitationRepository;
    @Autowired private CommercialFlowRepository flowRepository;
    @Autowired private CommercialPaymentSessionRepository paymentSessionRepository;
    @Autowired private CommercialPaymentEventRepository paymentEventRepository;
    @Autowired private CommercialEmailLogRepository commercialEmailLogRepository;
    @Autowired private ProvisioningRunRepository runRepository;
    @Autowired private ProvisioningStepRepository stepRepository;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void signedWebhookActivatesOnceAndKeepsProvidersInDryRun() throws Exception {
        ProvisioningPlanEntity plan = approvedPlan();

        LeadConversionRequest directConversion = new LeadConversionRequest();
        directConversion.setServiceKeys(List.of("web_seo", "crm"));
        directConversion.setConfirmed(true);
        assertThatThrownBy(() -> leadConversionService.convert(plan.getLead().getId(), directConversion))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Direct lead conversion is disabled");

        CreateCheckoutRequest checkoutRequest = new CreateCheckoutRequest();
        checkoutRequest.setAmountMinor(150000);
        checkoutRequest.setCurrency("EUR");
        checkoutRequest.setDescription("Commercial flow integration test");
        CommercialFlowResponse checkout = commercialFlowService.createCheckout(plan.getId(), checkoutRequest);

        assertThat(checkout.mockMode()).isTrue();
        assertThat(checkout.paymentStatus()).isEqualTo("PAYMENT_PENDING");
        assertThat(clientRepository.findBySourceLead(plan.getLead())).isEmpty();
        assertThat(workspaceRepository.count()).isZero();

        CommercialFlowEntity flow = flowRepository.findByPlan(plan).orElseThrow();
        CommercialPaymentSessionEntity session = paymentSessionRepository.findAllByFlowOrderByCreatedAtDesc(flow).getFirst();
        String eventId = "evt_commercial_" + UUID.randomUUID().toString().replace("-", "");
        String payload = objectMapper.writeValueAsString(Map.of(
                "id", eventId,
                "object", "event",
                "type", "checkout.session.completed",
                "data", Map.of("object", Map.of(
                        "id", session.getProviderSessionId(),
                        "object", "checkout.session",
                        "payment_status", "paid",
                        "payment_intent", "pi_test_only"
                ))
        ));
        String signature = stripeSignature(payload, WEBHOOK_SECRET);

        commercialFlowService.processStripeWebhook(payload, signature);
        commercialFlowService.processStripeWebhook(payload, signature);

        flow = flowRepository.findByPlan(plan).orElseThrow();
        ClientEntity client = clientRepository.findBySourceLead(plan.getLead()).orElseThrow();
        ClientWorkspaceEntity workspace = workspaceRepository.findByClient(client).orElseThrow();
        ProvisioningRunEntity run = runRepository.findAllByPlanOrderByCreatedAtDesc(plan).getFirst();
        List<ProvisioningStepEntity> steps = stepRepository.findAllByRunOrderByCreatedAt(run);

        assertThat(flow.getPaymentStatus()).isEqualTo("PAYMENT_CONFIRMED");
        assertThat(flow.getClientStatus()).isEqualTo("CLIENT_ACTIVE");
        assertThat(flow.getWorkspaceStatus()).isEqualTo("WORKSPACE_ACTIVE");
        assertThat(flow.getClient().getId()).isEqualTo(client.getId());
        assertThat(flow.getWorkspace().getId()).isEqualTo(workspace.getId());
        assertThat(clientRepository.count()).isEqualTo(1);
        assertThat(invitationRepository.count()).isEqualTo(1);
        assertThat(paymentEventRepository.count()).isEqualTo(1);
        assertThat(commercialEmailLogRepository.findAll())
                .extracting(CommercialEmailLogEntity::getEmailType)
                .containsExactlyInAnyOrder("PAYMENT_REQUEST", "PAYMENT_CONFIRMED", "PLAN_SUMMARY");
        assertThat(run.isDryRun()).isTrue();
        assertThat(run.getStatus()).isEqualTo("BLOCKED");
        assertThat(steps).isNotEmpty();
        assertThat(steps).anyMatch(step -> "JIRA".equals(step.getProvider()) && "DRY_RUN".equals(step.getStatus()));
        assertThat(steps).anyMatch(step -> "GOOGLE_DRIVE".equals(step.getProvider()) && "DRY_RUN".equals(step.getStatus()));
        assertThat(steps).anyMatch(step -> "GITHUB".equals(step.getProvider()) && "BLOCKED".equals(step.getStatus()));
        assertThat(steps).allMatch(step -> step.getExternalResourceId() == null && step.getExternalUrl() == null);
        assertThat(planRepository.findById(plan.getId()).orElseThrow().getStatus())
                .isEqualTo(ProvisioningPlanStatus.PARTIALLY_COMPLETED.value());
    }

    private ProvisioningPlanEntity approvedPlan() throws Exception {
        LeadEntity lead = new LeadEntity();
        lead.setFullName("Commercial Test Owner");
        lead.setBusinessName("Commercial Test Company");
        lead.setEmail("commercial-flow@example.com");
        lead.setPhone("+32 470 00 00 00");
        lead.setIndustry("Clinics");
        lead.setServiceInterest("Web and CRM");
        lead.setGoals("Verify payment-gated activation.");
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
        assessment.setQualificationSummary("Test-only approved scope.");
        assessment = assessmentRepository.saveAndFlush(assessment);

        ProvisioningPlanEntity plan = new ProvisioningPlanEntity();
        plan.setLead(lead);
        plan.setAssessment(assessment);
        plan.setRouteKey("COMPOSITE");
        plan.setAutomationLevel("A1");
        plan.setAutomationScope("controlled");
        plan.setStatus(ProvisioningPlanStatus.APPROVED.value());
        plan.setDryRun(true);
        plan.setNormalizedRequirementsJson("{\"requires_crm\":true}");
        plan.setDecisionReason("Approved H2 integration fixture.");
        plan.setRisksJson("[]");
        plan.setCostEstimate("Test only");
        plan.setTracksJson(objectMapper.writeValueAsString(List.of(
                track("WEB", "PROVISION_WEB_CUSTOM"),
                track("CRM", "PROVISION_CRM_ALTAIRA")
        )));
        plan.setSharedResourcesJson("[]");
        plan = planRepository.saveAndFlush(plan);

        ProvisioningPlanItemEntity github = new ProvisioningPlanItemEntity();
        github.setPlan(plan);
        github.setProviderKey("github");
        github.setResourceType("repository");
        github.setResourceName("commercial-test-company");
        github.setAction("create");
        github.setStatus("planned");
        github.setRequired(true);
        github.setReason("Selected for the custom web track.");
        github.setSortOrder(0);
        planItemRepository.save(github);
        return plan;
    }

    private Map<String, Object> track(String track, String route) {
        return Map.ofEntries(
                Map.entry("track", track),
                Map.entry("route", route),
                Map.entry("ruleId", "test-rule"),
                Map.entry("matchedSignals", List.of("test")),
                Map.entry("reason", "Test track"),
                Map.entry("confidence", 1.0),
                Map.entry("requiresManualDecision", false),
                Map.entry("automationLevel", "A1"),
                Map.entry("tools", List.of()),
                Map.entry("manualSteps", List.of()),
                Map.entry("risks", List.of())
        );
    }

    private String stripeSignature(String payload, String secret) throws Exception {
        long timestamp = Instant.now().getEpochSecond();
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal((timestamp + "." + payload).getBytes(StandardCharsets.UTF_8));
        return "t=" + timestamp + ",v1=" + HexFormat.of().formatHex(digest);
    }
}

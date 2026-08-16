package com.altaira.backend;

import com.altaira.backend.dto.commercial.CommercialFlowResponse;
import com.altaira.backend.dto.commercial.CreateCheckoutRequest;
import com.altaira.backend.dto.lead.CreateAdminLeadIntakeRequest;
import com.altaira.backend.dto.lead.LeadIntakeResponse;
import com.altaira.backend.dto.provisioning.CreateProvisioningDryRunRequest;
import com.altaira.backend.dto.provisioning.ProvisioningPlanResponse;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ProvisioningRunEntity;
import com.altaira.backend.entity.ProvisioningStepEntity;
import com.altaira.backend.model.ProvisioningPlanStatus;
import com.altaira.backend.repository.ClientInvitationRepository;
import com.altaira.backend.repository.ClientProjectRepository;
import com.altaira.backend.repository.ClientRepository;
import com.altaira.backend.repository.ClientServiceRepository;
import com.altaira.backend.repository.ClientWorkspaceRepository;
import com.altaira.backend.repository.CommercialEmailLogRepository;
import com.altaira.backend.repository.LeadRepository;
import com.altaira.backend.repository.ProvisioningPlanRepository;
import com.altaira.backend.repository.ProvisioningRunRepository;
import com.altaira.backend.repository.ProvisioningStepRepository;
import com.altaira.backend.service.CommercialFlowService;
import com.altaira.backend.service.LeadAssessmentService;
import com.altaira.backend.service.ProvisioningPlanService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:commercial_acceptance_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "altaira.commercial.legacy-direct-conversion-enabled=false",
        "altaira.commercial.stripe.enabled=false",
        "altaira.commercial.stripe.mode=mock",
        "altaira.commercial.stripe.mock-confirmation-enabled=true",
        "contact.email.enabled=false",
        "altaira.github.app.enabled=false",
        "altaira.github.provisioning.enabled=false",
        "altaira.github.dry-run=true",
        "altaira.client.invitation.activate-url=http://localhost:3000/client/activate"
})
@ActiveProfiles("test")
class CommercialFlowEndToEndAcceptanceTests {

    private static final List<String> RESEND_PAYLOADS = new CopyOnWriteArrayList<>();
    private static final HttpServer RESEND_STUB = startResendStub();

    @Autowired private LeadAssessmentService assessmentService;
    @Autowired private ProvisioningPlanService planService;
    @Autowired private CommercialFlowService commercialFlowService;
    @Autowired private LeadRepository leadRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private ClientWorkspaceRepository workspaceRepository;
    @Autowired private ClientServiceRepository clientServiceRepository;
    @Autowired private ClientProjectRepository clientProjectRepository;
    @Autowired private ClientInvitationRepository invitationRepository;
    @Autowired private CommercialEmailLogRepository emailLogRepository;
    @Autowired private ProvisioningPlanRepository planRepository;
    @Autowired private ProvisioningRunRepository runRepository;
    @Autowired private ProvisioningStepRepository stepRepository;
    @Autowired private ObjectMapper objectMapper;

    @DynamicPropertySource
    static void emailProperties(DynamicPropertyRegistry registry) {
        String apiUrl = "http://localhost:" + RESEND_STUB.getAddress().getPort() + "/emails";
        registry.add("altaira.commercial.email.enabled", () -> true);
        registry.add("altaira.commercial.email.resend.api-key", () -> "acceptance-test-key");
        registry.add("altaira.commercial.email.resend.api-url", () -> apiUrl);
        registry.add("altaira.commercial.email.from", () -> "onboarding@resend.dev");
        registry.add("altaira.onboarding.email.enabled", () -> true);
        registry.add("altaira.onboarding.email.resend.api-key", () -> "acceptance-test-key");
        registry.add("altaira.onboarding.email.resend.api-url", () -> apiUrl);
        registry.add("altaira.onboarding.email.from", () -> "onboarding@resend.dev");
    }

    @BeforeEach
    void resetStub() {
        RESEND_PAYLOADS.clear();
    }

    @AfterAll
    static void stopResendStub() {
        RESEND_STUB.stop(0);
    }

    @Test
    void intakeV2ReachesPaidWorkspaceAndAuditedDryRunProvisioning() throws Exception {
        CreateAdminLeadIntakeRequest intakeRequest = new CreateAdminLeadIntakeRequest();
        intakeRequest.setFullName("Altaira Test Lead");
        intakeRequest.setBusinessName("Altaira Workspace Test Project");
        intakeRequest.setEmail("altairalabs@gmail.com");
        intakeRequest.setPhone("+32 470 00 00 00");
        intakeRequest.setIndustry("Clinics");
        intakeRequest.setGoals("Validate the complete commercial activation path without external provider writes.");
        intakeRequest.setFormKey("general");
        intakeRequest.setSchemaVersion(2);
        intakeRequest.setResponses(Map.ofEntries(
                Map.entry("primaryGoal", "lead_management"),
                Map.entry("onlinePresence", "none"),
                Map.entry("bookingProcess", "not_applicable"),
                Map.entry("leadProcess", "spreadsheet"),
                Map.entry("repetitiveWork", "low"),
                Map.entry("reporting", "dashboard"),
                Map.entry("budgetBand", "5000_10000"),
                Map.entry("targetTimeline", "1_3_months"),
                Map.entry("commercialStage", "ready_for_proposal"),
                Map.entry("sensitiveData", "yes"),
                Map.entry("serviceSelectionConfirmation", "confirmed")
        ));

        LeadIntakeResponse intake = assessmentService.createAdminIntake(intakeRequest);
        assertThat(intake.getAssessment().getSchemaVersion()).isEqualTo(2);
        assertThat(intake.getAssessment().getRecommendedServiceKeys()).contains("crm", "web_seo");

        CreateProvisioningDryRunRequest planRequest = new CreateProvisioningDryRunRequest();
        planRequest.setAssessmentId(intake.getAssessment().getId());
        ProvisioningPlanResponse draftPlan = planService.generateDryRun(intake.getLead().getId(), planRequest);

        assertThat(draftPlan.dryRun()).isTrue();
        assertThat(draftPlan.executionAllowed()).isFalse();
        assertThat(draftPlan.tracks()).extracting(ProvisioningPlanResponse.Track::track)
                .contains("WEB", "CRM");

        ProvisioningPlanResponse approvedPlan = planService.updateStatus(
                draftPlan.id(),
                ProvisioningPlanStatus.APPROVED.value()
        );
        assertThat(approvedPlan.status()).isEqualTo(ProvisioningPlanStatus.APPROVED.value());

        CreateCheckoutRequest checkoutRequest = new CreateCheckoutRequest();
        checkoutRequest.setAmountMinor(150_000);
        checkoutRequest.setCurrency("EUR");
        checkoutRequest.setDescription("Altaira Workspace test plan");

        CommercialFlowResponse checkout = commercialFlowService.createCheckout(approvedPlan.id(), checkoutRequest);
        assertThat(checkout.paymentStatus()).isEqualTo("PAYMENT_PENDING");
        assertThat(checkout.clientId()).isNull();
        var sourceLead = leadRepository.findById(intake.getLead().getId()).orElseThrow();
        assertThat(clientRepository.findBySourceLead(sourceLead)).isEmpty();

        CommercialFlowResponse activated = commercialFlowService.confirmMock(approvedPlan.id());

        ClientEntity client = clientRepository.findBySourceLead(sourceLead).orElseThrow();
        var storedPlan = planRepository.findById(approvedPlan.id()).orElseThrow();
        ProvisioningRunEntity run = runRepository.findAllByPlanOrderByCreatedAtDesc(
                storedPlan
        ).stream().findFirst().orElseThrow();
        List<ProvisioningStepEntity> steps = stepRepository.findAllByRunOrderByCreatedAt(run);

        assertThat(activated.paymentStatus()).isEqualTo("PAYMENT_CONFIRMED");
        assertThat(activated.clientStatus()).isEqualTo("CLIENT_ACTIVE");
        assertThat(activated.workspaceStatus()).isEqualTo("WORKSPACE_ACTIVE");
        assertThat(activated.invitationStatus()).isEqualTo("INVITATION_SENT");
        assertThat(workspaceRepository.findByClient(client)).isPresent();
        assertThat(clientServiceRepository.findAllByClientOrderByCreatedAtDesc(client)).hasSize(2);
        assertThat(clientProjectRepository.findAllByClientOrderByCreatedAtAsc(client)).hasSize(2);
        assertThat(invitationRepository.findAllByClientOrderByCreatedAtDesc(client)).hasSize(1);

        assertThat(run.isDryRun()).isTrue();
        assertThat(steps).isNotEmpty();
        assertThat(steps).allMatch(step -> step.getExternalResourceId() == null && step.getExternalUrl() == null);
        assertThat(steps).anyMatch(step -> "JIRA".equals(step.getProvider()) && "DRY_RUN".equals(step.getStatus()));
        assertThat(steps).anyMatch(step -> "GOOGLE_DRIVE".equals(step.getProvider()) && "DRY_RUN".equals(step.getStatus()));

        assertThat(emailLogRepository.findAll())
                .extracting(log -> log.getEmailType() + ":" + log.getStatus())
                .contains("PAYMENT_REQUEST:SKIPPED", "PAYMENT_CONFIRMED:SENT", "PLAN_SUMMARY:SENT");
        assertThat(RESEND_PAYLOADS).hasSize(3);
        assertThat(RESEND_PAYLOADS.stream().map(this::subject).toList())
                .containsExactlyInAnyOrder(
                        "Payment confirmed - Altaira Labs",
                        "Your Altaira Labs delivery plan",
                        "Your Altaira Labs client workspace is ready"
                );
    }

    private String subject(String payload) {
        try {
            return objectMapper.readTree(payload).path("subject").asText();
        } catch (IOException exception) {
            throw new IllegalStateException("Resend test payload could not be read", exception);
        }
    }

    private static HttpServer startResendStub() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            server.createContext("/emails", exchange -> {
                RESEND_PAYLOADS.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                byte[] response = "{\"id\":\"email_acceptance_test\"}".getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, response.length);
                exchange.getResponseBody().write(response);
                exchange.close();
            });
            server.start();
            return server;
        } catch (IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }
}

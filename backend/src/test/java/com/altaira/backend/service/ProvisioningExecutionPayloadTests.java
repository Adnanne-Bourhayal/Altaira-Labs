package com.altaira.backend.service;

import com.altaira.backend.entity.*;
import com.altaira.backend.model.ProvisioningPlanStatus;
import com.altaira.backend.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:provisioning_payload_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "altaira.commercial.email.enabled=false",
        "altaira.onboarding.email.enabled=false",
        "contact.email.enabled=false",
        "altaira.github.app.enabled=false",
        "altaira.github.provisioning.enabled=false",
        "altaira.github.dry-run=true"
})
@ActiveProfiles("test")
class ProvisioningExecutionPayloadTests {
    @Autowired private ProvisioningExecutionService executionService;
    @Autowired private LeadRepository leadRepository;
    @Autowired private LeadAssessmentRepository assessmentRepository;
    @Autowired private ProvisioningPlanRepository planRepository;
    @Autowired private ProvisioningPlanItemRepository planItemRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private ClientWorkspaceRepository workspaceRepository;
    @Autowired private ProvisioningRunRepository runRepository;
    @Autowired private ProvisioningStepRepository stepRepository;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void preparesConcreteProviderPayloadsWithoutExternalWritesAndReusesTheRun() throws Exception {
        Fixture fixture = fixture();

        ProvisioningRunEntity first = executionService.createDryRun(fixture.plan(), fixture.client(), fixture.workspace());
        ProvisioningRunEntity second = executionService.createDryRun(fixture.plan(), fixture.client(), fixture.workspace());

        assertThat(second.getId()).isEqualTo(first.getId());
        assertThat(runRepository.count()).isEqualTo(1);
        assertThat(first.isDryRun()).isTrue();
        assertThat(first.getStatus()).isEqualTo("BLOCKED");

        List<ProvisioningStepEntity> steps = stepRepository.findAllByRunOrderByCreatedAt(first);
        assertThat(steps).hasSize(34);
        assertThat(steps).allMatch(step -> step.getExternalResourceId() == null && step.getExternalUrl() == null);
        assertThat(steps).allMatch(step -> step.getAttempts() == 0);
        assertThat(steps).allMatch(step -> step.getStartedAt() != null && step.getCompletedAt() != null);

        assertTrackTasks(steps, "WEB", List.of("Discovery", "Copy and structure", "Design", "Development", "Review", "Launch"));
        assertTrackTasks(steps, "BOOKING", List.of("Requirements", "Calendar rules", "Reminder setup", "Booking test"));
        assertTrackTasks(steps, "CRM", List.of("Pipeline", "Lead stages", "Import", "Workspace review", "Handover"));
        assertTrackTasks(steps, "AUTOMATION", List.of("Trigger map", "Action map", "Test", "Monitoring"));
        assertTrackTasks(steps, "DASHBOARD", List.of("KPI definitions", "Data sources", "Layout", "Validation"));

        assertThat(steps.stream().filter(step -> "GOOGLE_DRIVE".equals(step.getProvider())).map(ProvisioningStepEntity::getAction))
                .containsExactlyInAnyOrder(
                        "Create folder: 00_Admin", "Create folder: 01_Discovery", "Create folder: 02_Assets",
                        "Create folder: 03_Deliverables", "Create folder: 04_Approvals", "Create folder: 05_Invoices"
                );

        ProvisioningStepEntity jira = find(steps, "JIRA", "Create task: Booking test");
        JsonNode jiraPayload = objectMapper.readTree(jira.getInputSummaryJson());
        assertThat(jiraPayload.path("dryRun").asBoolean()).isTrue();
        assertThat(jiraPayload.path("externalWrite").asBoolean()).isFalse();
        assertThat(jiraPayload.path("track").asText()).isEqualTo("BOOKING");
        assertThat(jiraPayload.path("summary").asText()).isEqualTo("Booking test");
        assertThat(jiraPayload.path("projectPolicy").asText()).contains("admin-approval");

        JsonNode drivePayload = objectMapper.readTree(find(steps, "GOOGLE_DRIVE", "Create folder: 02_Assets").getInputSummaryJson());
        assertThat(drivePayload.path("folderName").asText()).isEqualTo("02_Assets");
        assertThat(drivePayload.path("sharingPolicy").asText()).isEqualTo("private-until-reviewed");

        JsonNode calendarPayload = objectMapper.readTree(find(steps, "GOOGLE_CALENDAR", "Create kickoff event").getInputSummaryJson());
        assertThat(calendarPayload.path("timezone").asText()).isEqualTo("Europe/Brussels");
        assertThat(calendarPayload.path("durationMinutes").asInt()).isEqualTo(60);

        ProvisioningStepEntity github = providerItem(steps, "GITHUB");
        assertThat(github.getStatus()).isEqualTo("BLOCKED");
        assertThat(github.isManualActionRequired()).isTrue();
        assertThat(objectMapper.readTree(github.getInputSummaryJson()).path("credentialState").asText()).isEqualTo("missing");

        assertThat(objectMapper.readTree(providerItem(steps, "NEON").getInputSummaryJson()).path("tenancyStrategy").asText())
                .isEqualTo("shared-database");
        assertThat(objectMapper.readTree(providerItem(steps, "VERCEL").getInputSummaryJson()).path("deploymentPolicy").asText())
                .isEqualTo("preview-first-after-approval");
        assertThat(objectMapper.readTree(providerItem(steps, "RENDER").getInputSummaryJson()).path("deploymentPolicy").asText())
                .isEqualTo("service-and-cost-review-required");

        assertThat(steps).allSatisfy(step -> {
            assertThat(step.getInputSummaryJson()).doesNotContain("email", "phone", "password", "secret", "token");
            assertThat(objectMapper.readTree(step.getInputSummaryJson()).path("externalWrite").asBoolean()).isFalse();
        });
    }

    private void assertTrackTasks(List<ProvisioningStepEntity> steps, String track, List<String> tasks) {
        assertThat(steps.stream()
                .filter(step -> "JIRA".equals(step.getProvider()) && track.equals(step.getTrackKey()))
                .map(ProvisioningStepEntity::getAction))
                .containsExactlyInAnyOrderElementsOf(tasks.stream().map(task -> "Create task: " + task).toList());
    }

    private ProvisioningStepEntity find(List<ProvisioningStepEntity> steps, String provider, String action) {
        return steps.stream().filter(step -> provider.equals(step.getProvider()) && action.equals(step.getAction()))
                .findFirst().orElseThrow();
    }

    private ProvisioningStepEntity providerItem(List<ProvisioningStepEntity> steps, String provider) {
        return steps.stream().filter(step -> provider.equals(step.getProvider()) && step.getTrackKey() == null)
                .findFirst().orElseThrow();
    }

    private Fixture fixture() throws Exception {
        LeadEntity lead = new LeadEntity();
        lead.setFullName("Provisioning Payload Owner");
        lead.setBusinessName("Altaira Payload Demo");
        lead.setEmail("payload-demo@example.com");
        lead.setPhone("+32 470 00 00 00");
        lead.setIndustry("Clinics");
        lead.setServiceInterest("Multi-track demo");
        lead.setGoals("Validate dry-run provider payloads.");
        lead.setStatus("qualified");
        lead.setCreatedAt(Instant.now());
        lead = leadRepository.saveAndFlush(lead);

        LeadAssessmentEntity assessment = new LeadAssessmentEntity();
        assessment.setLead(lead);
        assessment.setFormKey("general");
        assessment.setSchemaVersion(2);
        assessment.setStatus("reviewed");
        assessment.setResponsesJson("{}");
        assessment.setRecommendedServicesJson("[]");
        assessment.setQualificationSummary("Fixture only.");
        assessment = assessmentRepository.saveAndFlush(assessment);

        ProvisioningPlanEntity plan = new ProvisioningPlanEntity();
        plan.setLead(lead);
        plan.setAssessment(assessment);
        plan.setRouteKey("COMPOSITE");
        plan.setAutomationLevel("A1");
        plan.setAutomationScope("controlled");
        plan.setStatus(ProvisioningPlanStatus.APPROVED.value());
        plan.setDryRun(true);
        plan.setNormalizedRequirementsJson("{}");
        plan.setDecisionReason("Payload fixture.");
        plan.setRisksJson("[]");
        plan.setCostEstimate("Fixture only");
        plan.setTracksJson(objectMapper.writeValueAsString(List.of(
                track("WEB"), track("BOOKING"), track("CRM"), track("AUTOMATION"), track("DASHBOARD")
        )));
        plan.setSharedResourcesJson("[]");
        plan = planRepository.saveAndFlush(plan);

        ClientEntity client = new ClientEntity();
        client.setName("Provisioning Payload Owner");
        client.setCompany("Altaira Payload Demo");
        client.setEmail("payload-demo@example.com");
        client.setStatus("active");
        client.setSourceLead(lead);
        client = clientRepository.saveAndFlush(client);

        ClientWorkspaceEntity workspace = new ClientWorkspaceEntity();
        workspace.setClient(client);
        workspace.setName("Altaira Payload Demo Workspace");
        workspace.setStatus("active");
        workspace = workspaceRepository.saveAndFlush(workspace);

        addItem(plan, "github", "repository", "altaira-payload-demo", "create", 0);
        addItem(plan, "neon", "database", "shared tenant", "prepare", 1);
        addItem(plan, "vercel", "project", "altaira-payload-demo-web", "prepare", 2);
        addItem(plan, "render", "service", "altaira-payload-demo-api", "prepare", 3);
        return new Fixture(plan, client, workspace);
    }

    private void addItem(ProvisioningPlanEntity plan, String provider, String type, String name, String action, int order) {
        ProvisioningPlanItemEntity item = new ProvisioningPlanItemEntity();
        item.setPlan(plan);
        item.setProviderKey(provider);
        item.setResourceType(type);
        item.setResourceName(name);
        item.setAction(action);
        item.setStatus("planned");
        item.setRequired(true);
        item.setReason("Fixture-only provider plan.");
        item.setSortOrder(order);
        planItemRepository.saveAndFlush(item);
    }

    private Map<String, Object> track(String key) {
        return Map.ofEntries(
                Map.entry("track", key), Map.entry("route", "TEST_" + key), Map.entry("ruleId", "fixture"),
                Map.entry("matchedSignals", List.of("fixture")), Map.entry("reason", "Fixture track"),
                Map.entry("confidence", 1.0), Map.entry("requiresManualDecision", false),
                Map.entry("automationLevel", "A1"), Map.entry("tools", List.of()),
                Map.entry("manualSteps", List.of()), Map.entry("risks", List.of())
        );
    }

    private record Fixture(ProvisioningPlanEntity plan, ClientEntity client, ClientWorkspaceEntity workspace) {}
}

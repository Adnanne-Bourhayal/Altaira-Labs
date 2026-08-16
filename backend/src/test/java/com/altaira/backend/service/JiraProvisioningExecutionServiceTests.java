package com.altaira.backend.service;

import com.altaira.backend.dto.jira.ExecuteJiraIssuesRequest;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientWorkspaceEntity;
import com.altaira.backend.entity.CommercialFlowEntity;
import com.altaira.backend.entity.ProvisioningExternalResourceEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import com.altaira.backend.entity.ProvisioningRunEntity;
import com.altaira.backend.entity.ProvisioningStepEntity;
import com.altaira.backend.integration.jira.JiraIntegrationException;
import com.altaira.backend.integration.jira.JiraIssueProvisioner;
import com.altaira.backend.integration.jira.JiraIssueProvisioningResult;
import com.altaira.backend.integration.jira.JiraProperties;
import com.altaira.backend.model.CommercialClientStatus;
import com.altaira.backend.model.CommercialPaymentStatus;
import com.altaira.backend.model.CommercialWorkspaceStatus;
import com.altaira.backend.model.ProvisioningPlanStatus;
import com.altaira.backend.model.ProvisioningStepStatus;
import com.altaira.backend.repository.CommercialFlowRepository;
import com.altaira.backend.repository.ProvisioningExternalResourceRepository;
import com.altaira.backend.repository.ProvisioningPlanRepository;
import com.altaira.backend.repository.ProvisioningRunRepository;
import com.altaira.backend.repository.ProvisioningStepRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class JiraProvisioningExecutionServiceTests {

    private final ProvisioningPlanRepository planRepository = mock(ProvisioningPlanRepository.class);
    private final CommercialFlowRepository commercialFlowRepository = mock(CommercialFlowRepository.class);
    private final ProvisioningRunRepository runRepository = mock(ProvisioningRunRepository.class);
    private final ProvisioningStepRepository stepRepository = mock(ProvisioningStepRepository.class);
    private final ProvisioningExternalResourceRepository externalResourceRepository =
            mock(ProvisioningExternalResourceRepository.class);
    private final JiraIssueProvisioner issueProvisioner = mock(JiraIssueProvisioner.class);

    private final UUID planId = UUID.fromString("ce35f5af-d0bf-4f15-867f-3795f4932a0e");
    private final UUID sourceStepId = UUID.fromString("026e0e20-5006-4850-ab4d-13263b42dd62");
    private final Map<String, ProvisioningRunEntity> runs = new HashMap<>();
    private final Map<String, ProvisioningStepEntity> steps = new HashMap<>();
    private final Map<String, ProvisioningExternalResourceEntity> resources = new HashMap<>();
    private ProvisioningPlanEntity plan;
    private CommercialFlowEntity flow;
    private ProvisioningRunEntity sourceRun;
    private ProvisioningStepEntity sourceStep;

    @BeforeEach
    void setUp() {
        plan = approvedPlan();
        flow = activeFlow(plan);
        sourceRun = sourceRun(plan, flow);
        sourceStep = sourceStep(sourceRun);
        runs.put(sourceRun.getIdempotencyKey(), sourceRun);

        when(planRepository.findByIdForUpdate(planId)).thenReturn(Optional.of(plan));
        when(commercialFlowRepository.findByPlan(plan)).thenReturn(Optional.of(flow));
        when(runRepository.findByIdempotencyKey(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(runs.get(invocation.getArgument(0))));
        when(runRepository.saveAndFlush(any())).thenAnswer(invocation -> saveRun(invocation.getArgument(0)));
        when(runRepository.save(any())).thenAnswer(invocation -> saveRun(invocation.getArgument(0)));
        when(stepRepository.findAllByRunOrderByCreatedAt(sourceRun)).thenReturn(List.of(sourceStep));
        when(stepRepository.findByIdempotencyKey(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(steps.get(invocation.getArgument(0))));
        when(stepRepository.save(any())).thenAnswer(invocation -> saveStep(invocation.getArgument(0)));
        when(externalResourceRepository.findByIdempotencyKey(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(resources.get(invocation.getArgument(0))));
        when(externalResourceRepository.save(any())).thenAnswer(invocation -> {
            ProvisioningExternalResourceEntity resource = invocation.getArgument(0);
            if (resource.getId() == null) {
                resource.setId(UUID.fromString("2782f5d7-249c-4e0c-9e9d-95b7b5f52e8a"));
            }
            resources.put(resource.getIdempotencyKey(), resource);
            return resource;
        });
    }

    @Test
    void requiresExactConfirmationBeforeReadingPlanData() {
        JiraProvisioningExecutionService service = service(liveProperties());

        assertThatThrownBy(() -> service.executeIssues(planId, new ExecuteJiraIssuesRequest("yes")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));

        verifyNoInteractions(planRepository);
        verify(issueProvisioner, never()).ensureTask(anyString(), anyString(), anyList(), anyString());
    }

    @Test
    void dryRunGateBlocksBeforePersistingLiveRun() {
        JiraProvisioningExecutionService service = service(properties(true, true, true));

        assertThatThrownBy(() -> service.executeIssues(planId, confirmedRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        verifyNoInteractions(planRepository);
        verify(issueProvisioner, never()).ensureTask(anyString(), anyString(), anyList(), anyString());
    }

    @Test
    void createsApprovedIssueOnceAndReusesPersistedResult() {
        when(issueProvisioner.ensureTask(anyString(), anyString(), anyList(), anyString()))
                .thenReturn(createdResult());
        JiraProvisioningExecutionService service = service(liveProperties());

        var first = service.executeIssues(planId, confirmedRequest());
        var repeated = service.executeIssues(planId, confirmedRequest());

        assertThat(first.status()).isEqualTo(ProvisioningStepStatus.COMPLETED.name());
        assertThat(first.created()).isEqualTo(1);
        assertThat(first.reused()).isZero();
        assertThat(first.failed()).isZero();
        assertThat(first.issues()).singleElement().satisfies(issue -> {
            assertThat(issue.issueKey()).isEqualTo("AL-12");
            assertThat(issue.attempts()).isEqualTo(1);
            assertThat(issue.created()).isTrue();
        });
        assertThat(repeated.created()).isZero();
        assertThat(repeated.reused()).isEqualTo(1);
        assertThat(repeated.issues()).singleElement().satisfies(issue -> {
            assertThat(issue.issueKey()).isEqualTo("AL-12");
            assertThat(issue.attempts()).isEqualTo(1);
            assertThat(issue.reused()).isTrue();
        });
        verify(issueProvisioner).ensureTask(
                "Discovery",
                "Altaira approved delivery task.\nWorkspace: Iberia Dental Workspace\nService track: WEB\nProvisioning plan: " + planId,
                List.of("web"),
                "altaira-plan-ce35f5afd0bf4f15867f3795f4932a0e-step-026e0e2050064850ab4d13263b42dd62"
        );
    }

    @Test
    void persistsSafeFailureAndRetriesOnlyFailedIssue() {
        when(issueProvisioner.ensureTask(anyString(), anyString(), anyList(), anyString()))
                .thenThrow(JiraIntegrationException.safe("Jira API connection failed."))
                .thenReturn(createdResult());
        JiraProvisioningExecutionService service = service(liveProperties());

        var failed = service.executeIssues(planId, confirmedRequest());
        var retried = service.executeIssues(planId, confirmedRequest());

        assertThat(failed.status()).isEqualTo(ProvisioningStepStatus.FAILED.name());
        assertThat(failed.failed()).isEqualTo(1);
        assertThat(failed.issues()).singleElement().satisfies(issue -> {
            assertThat(issue.status()).isEqualTo(ProvisioningStepStatus.FAILED.name());
            assertThat(issue.message()).isEqualTo("Jira API connection failed.");
        });
        assertThat(retried.status()).isEqualTo(ProvisioningStepStatus.COMPLETED.name());
        assertThat(retried.failed()).isZero();
        assertThat(retried.issues()).singleElement().satisfies(issue -> assertThat(issue.attempts()).isEqualTo(2));
        verify(issueProvisioner, org.mockito.Mockito.times(2))
                .ensureTask(anyString(), anyString(), anyList(), anyString());
    }

    @Test
    void continuesIndependentTasksAndMarksPartialCompletion() {
        ProvisioningStepEntity secondStep = sourceStep(
                sourceRun,
                UUID.fromString("63030419-fb1b-4015-9500-c19aa268b7b8"),
                "BOOKING",
                "Booking test"
        );
        when(stepRepository.findAllByRunOrderByCreatedAt(sourceRun)).thenReturn(List.of(sourceStep, secondStep));
        when(issueProvisioner.ensureTask(anyString(), anyString(), anyList(), anyString()))
                .thenReturn(createdResult())
                .thenThrow(JiraIntegrationException.safe("Jira validation rejected one issue."));
        JiraProvisioningExecutionService service = service(liveProperties());

        var result = service.executeIssues(planId, confirmedRequest());

        assertThat(result.status()).isEqualTo("PARTIALLY_COMPLETED");
        assertThat(result.created()).isEqualTo(1);
        assertThat(result.failed()).isEqualTo(1);
        assertThat(result.issues()).hasSize(2);
        verify(issueProvisioner, org.mockito.Mockito.times(2))
                .ensureTask(anyString(), anyString(), anyList(), anyString());
    }

    private JiraProvisioningExecutionService service(JiraProperties properties) {
        return new JiraProvisioningExecutionService(
                planRepository,
                commercialFlowRepository,
                runRepository,
                stepRepository,
                externalResourceRepository,
                issueProvisioner,
                properties,
                new ObjectMapper()
        );
    }

    private ProvisioningRunEntity saveRun(ProvisioningRunEntity run) {
        if (run.getId() == null) {
            ReflectionTestUtils.setField(run, "id", UUID.fromString("6506370e-8937-4586-8916-d325702ef5d6"));
        }
        runs.put(run.getIdempotencyKey(), run);
        return run;
    }

    private ProvisioningStepEntity saveStep(ProvisioningStepEntity step) {
        if (step.getId() == null) {
            ReflectionTestUtils.setField(step, "id", UUID.fromString("7db4f20e-151a-4d3f-af14-9719c4f8c402"));
        }
        steps.put(step.getIdempotencyKey(), step);
        return step;
    }

    private ProvisioningPlanEntity approvedPlan() {
        ProvisioningPlanEntity entity = new ProvisioningPlanEntity();
        entity.setId(planId);
        entity.setStatus(ProvisioningPlanStatus.APPROVED.value());
        return entity;
    }

    private CommercialFlowEntity activeFlow(ProvisioningPlanEntity entity) {
        ClientEntity client = new ClientEntity();
        client.setId(UUID.fromString("329076bf-c206-466c-a586-a31f838b7317"));
        client.setName("Iberia Dental Owner");
        client.setCompany("Iberia Dental");
        client.setEmail("owner@example.com");

        ClientWorkspaceEntity workspace = new ClientWorkspaceEntity();
        workspace.setId(UUID.fromString("336c15d5-4639-48e8-8b54-84129bee1cb4"));
        workspace.setClient(client);
        workspace.setName("Iberia Dental Workspace");

        CommercialFlowEntity commercialFlow = new CommercialFlowEntity();
        commercialFlow.setPlan(entity);
        commercialFlow.setClient(client);
        commercialFlow.setWorkspace(workspace);
        commercialFlow.setPaymentStatus(CommercialPaymentStatus.PAYMENT_CONFIRMED.name());
        commercialFlow.setClientStatus(CommercialClientStatus.CLIENT_ACTIVE.name());
        commercialFlow.setWorkspaceStatus(CommercialWorkspaceStatus.WORKSPACE_ACTIVE.name());
        return commercialFlow;
    }

    private ProvisioningRunEntity sourceRun(
            ProvisioningPlanEntity entity,
            CommercialFlowEntity commercialFlow
    ) {
        ProvisioningRunEntity run = new ProvisioningRunEntity();
        ReflectionTestUtils.setField(run, "id", UUID.fromString("d1526733-09af-4431-9189-aa80e7c68003"));
        run.setPlan(entity);
        run.setClient(commercialFlow.getClient());
        run.setWorkspace(commercialFlow.getWorkspace());
        run.setDryRun(true);
        run.setStatus(ProvisioningStepStatus.COMPLETED.name());
        run.setIdempotencyKey(planId + ":commercial-v1");
        return run;
    }

    private ProvisioningStepEntity sourceStep(ProvisioningRunEntity run) {
        return sourceStep(run, sourceStepId, "WEB", "Discovery");
    }

    private ProvisioningStepEntity sourceStep(
            ProvisioningRunEntity run,
            UUID id,
            String track,
            String summary
    ) {
        ProvisioningStepEntity step = new ProvisioningStepEntity();
        ReflectionTestUtils.setField(step, "id", id);
        step.setRun(run);
        step.setTrackKey(track);
        step.setProvider("JIRA");
        step.setAction("Create task: " + summary);
        step.setInputSummaryJson("{\"summary\":\"" + summary + "\"}");
        step.setStatus(ProvisioningStepStatus.DRY_RUN.name());
        step.setIdempotencyKey("source-step:" + id);
        return step;
    }

    private ExecuteJiraIssuesRequest confirmedRequest() {
        return new ExecuteJiraIssuesRequest(JiraProvisioningExecutionService.CONFIRMATION);
    }

    private JiraIssueProvisioningResult createdResult() {
        return new JiraIssueProvisioningResult(
                true,
                false,
                "10001",
                "AL-12",
                "https://example.atlassian.net/browse/AL-12"
        );
    }

    private JiraProperties liveProperties() {
        return properties(true, true, false);
    }

    private JiraProperties properties(boolean enabled, boolean provisioningEnabled, boolean dryRun) {
        return new JiraProperties(
                enabled,
                provisioningEnabled,
                dryRun,
                "https://example.atlassian.net",
                "automation@example.com",
                "test-token",
                "AL",
                "Task"
        );
    }
}

package com.altaira.backend.service;

import com.altaira.backend.dto.github.ExecuteGitHubRepositoryRequest;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientWorkspaceEntity;
import com.altaira.backend.entity.CommercialFlowEntity;
import com.altaira.backend.entity.ProvisioningExternalResourceEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import com.altaira.backend.entity.ProvisioningPlanItemEntity;
import com.altaira.backend.entity.ProvisioningRunEntity;
import com.altaira.backend.entity.ProvisioningStepEntity;
import com.altaira.backend.integration.github.GitHubAppProperties;
import com.altaira.backend.integration.github.GitHubIntegrationException;
import com.altaira.backend.integration.github.GitHubRepositoryProvisioner;
import com.altaira.backend.integration.github.GitHubRepositoryProvisioningResult;
import com.altaira.backend.model.CommercialClientStatus;
import com.altaira.backend.model.CommercialPaymentStatus;
import com.altaira.backend.model.CommercialWorkspaceStatus;
import com.altaira.backend.model.ProvisioningPlanStatus;
import com.altaira.backend.repository.CommercialFlowRepository;
import com.altaira.backend.repository.ProvisioningExternalResourceRepository;
import com.altaira.backend.repository.ProvisioningPlanItemRepository;
import com.altaira.backend.repository.ProvisioningPlanRepository;
import com.altaira.backend.repository.ProvisioningRunRepository;
import com.altaira.backend.repository.ProvisioningStepRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class GitHubProvisioningExecutionServiceTests {

    private final ProvisioningPlanRepository planRepository = mock(ProvisioningPlanRepository.class);
    private final ProvisioningPlanItemRepository planItemRepository = mock(ProvisioningPlanItemRepository.class);
    private final CommercialFlowRepository commercialFlowRepository = mock(CommercialFlowRepository.class);
    private final ProvisioningRunRepository runRepository = mock(ProvisioningRunRepository.class);
    private final ProvisioningStepRepository stepRepository = mock(ProvisioningStepRepository.class);
    private final ProvisioningExternalResourceRepository externalResourceRepository = mock(ProvisioningExternalResourceRepository.class);
    private final GitHubRepositoryProvisioner repositoryProvisioner = mock(GitHubRepositoryProvisioner.class);

    private final UUID planId = UUID.fromString("ce35f5af-d0bf-4f15-867f-3795f4932a0e");
    private final AtomicReference<ProvisioningRunEntity> runState = new AtomicReference<>();
    private final AtomicReference<ProvisioningStepEntity> stepState = new AtomicReference<>();
    private final List<ProvisioningExternalResourceEntity> resources = new ArrayList<>();
    private ProvisioningPlanEntity plan;
    private CommercialFlowEntity flow;

    @BeforeEach
    void setUp() {
        plan = approvedPlan();
        flow = activeFlow(plan);
        ProvisioningPlanItemEntity item = githubPlanItem(plan);

        when(planRepository.findByIdForUpdate(planId)).thenReturn(Optional.of(plan));
        when(commercialFlowRepository.findByPlan(plan)).thenReturn(Optional.of(flow));
        when(planItemRepository.findAllByPlanOrderBySortOrder(plan)).thenReturn(List.of(item));
        when(planItemRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        when(runRepository.findByIdempotencyKey(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(runState.get()));
        when(runRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            ProvisioningRunEntity run = invocation.getArgument(0);
            ReflectionTestUtils.setField(run, "id", UUID.fromString("6506370e-8937-4586-8916-d325702ef5d6"));
            runState.set(run);
            return run;
        });
        when(runRepository.save(any())).thenAnswer(invocation -> {
            ProvisioningRunEntity run = invocation.getArgument(0);
            runState.set(run);
            return run;
        });

        when(stepRepository.findByIdempotencyKey(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(stepState.get()));
        when(stepRepository.save(any())).thenAnswer(invocation -> {
            ProvisioningStepEntity step = invocation.getArgument(0);
            if (step.getId() == null) {
                ReflectionTestUtils.setField(step, "id", UUID.fromString("026e0e20-5006-4850-ab4d-13263b42dd62"));
            }
            stepState.set(step);
            return step;
        });

        when(externalResourceRepository.findAllByPlanOrderByProviderKey(plan))
                .thenAnswer(invocation -> List.copyOf(resources));
        when(externalResourceRepository.save(any())).thenAnswer(invocation -> {
            ProvisioningExternalResourceEntity resource = invocation.getArgument(0);
            if (resource.getId() == null) {
                resource.setId(UUID.fromString("2782f5d7-249c-4e0c-9e9d-95b7b5f52e8a"));
            }
            if (!resources.contains(resource)) {
                resources.add(resource);
            }
            return resource;
        });
    }

    @Test
    void requiresExactConfirmationBeforeReadingOrWritingPlanData() {
        GitHubProvisioningExecutionService service = service(liveProperties());

        assertThatThrownBy(() -> service.executePrivateRepository(
                planId,
                new ExecuteGitHubRepositoryRequest("yes")
        )).isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));

        verifyNoInteractions(planRepository);
        verify(repositoryProvisioner, never()).ensurePrivateRepository(anyString(), anyString());
    }

    @Test
    void defaultDryRunGateBlocksBeforePersistingAnExecution() {
        GitHubProvisioningExecutionService service = service(properties(true, true, true));

        assertThatThrownBy(() -> service.executePrivateRepository(planId, confirmedRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        verifyNoInteractions(planRepository);
        verify(runRepository, never()).saveAndFlush(any());
        verify(repositoryProvisioner, never()).ensurePrivateRepository(anyString(), anyString());
    }

    @Test
    void createsPrivateRepositoryOnceAndReusesPersistedResultOnRepeat() {
        when(repositoryProvisioner.ensurePrivateRepository(anyString(), anyString()))
                .thenReturn(createdResult());
        GitHubProvisioningExecutionService service = service(liveProperties());

        var first = service.executePrivateRepository(planId, confirmedRequest());
        var repeated = service.executePrivateRepository(planId, confirmedRequest());

        assertThat(first.status()).isEqualTo("COMPLETED");
        assertThat(first.attempts()).isEqualTo(1);
        assertThat(first.dryRun()).isFalse();
        assertThat(first.executionAllowed()).isTrue();
        assertThat(first.created()).isTrue();
        assertThat(first.reused()).isFalse();
        assertThat(first.externalResourceId()).isEqualTo("123456");
        assertThat(repeated.runId()).isEqualTo(first.runId());
        assertThat(repeated.stepId()).isEqualTo(first.stepId());
        assertThat(repeated.attempts()).isEqualTo(1);
        verify(repositoryProvisioner).ensurePrivateRepository(
                "iberia-dental-iberia-dental-workspace",
                "Private Altaira Labs workspace repository for Iberia Dental."
        );
    }

    @Test
    void persistsSafeFailureAndAllowsControlledRetry() {
        when(repositoryProvisioner.ensurePrivateRepository(anyString(), anyString()))
                .thenThrow(GitHubIntegrationException.safe("GitHub API connection failed."))
                .thenReturn(createdResult());
        GitHubProvisioningExecutionService service = service(liveProperties());

        var failed = service.executePrivateRepository(planId, confirmedRequest());
        var retried = service.executePrivateRepository(planId, confirmedRequest());

        assertThat(failed.status()).isEqualTo("FAILED");
        assertThat(failed.attempts()).isEqualTo(1);
        assertThat(failed.message()).isEqualTo("GitHub API connection failed.");
        assertThat(retried.status()).isEqualTo("COMPLETED");
        assertThat(retried.attempts()).isEqualTo(2);
        assertThat(retried.created()).isTrue();
        verify(repositoryProvisioner, org.mockito.Mockito.times(2))
                .ensurePrivateRepository(anyString(), anyString());
    }

    private GitHubProvisioningExecutionService service(GitHubAppProperties properties) {
        return new GitHubProvisioningExecutionService(
                planRepository,
                planItemRepository,
                commercialFlowRepository,
                runRepository,
                stepRepository,
                externalResourceRepository,
                repositoryProvisioner,
                properties,
                new ObjectMapper()
        );
    }

    private ProvisioningPlanEntity approvedPlan() {
        ProvisioningPlanEntity entity = new ProvisioningPlanEntity();
        entity.setId(planId);
        entity.setStatus(ProvisioningPlanStatus.APPROVED.value());
        entity.setRouteKey("PROVISION_WEB_CUSTOM");
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

    private ProvisioningPlanItemEntity githubPlanItem(ProvisioningPlanEntity entity) {
        ProvisioningPlanItemEntity item = new ProvisioningPlanItemEntity();
        item.setPlan(entity);
        item.setProviderKey("GITHUB");
        item.setResourceType("repository");
        item.setResourceName("Private project repository");
        item.setAction("create");
        item.setStatus("planned");
        return item;
    }

    private ExecuteGitHubRepositoryRequest confirmedRequest() {
        return new ExecuteGitHubRepositoryRequest(GitHubProvisioningExecutionService.CONFIRMATION);
    }

    private GitHubRepositoryProvisioningResult createdResult() {
        return new GitHubRepositoryProvisioningResult(
                true,
                false,
                "123456",
                "Altaira-Labs/iberia-dental-iberia-dental-workspace",
                "https://github.com/Altaira-Labs/iberia-dental-iberia-dental-workspace",
                "private"
        );
    }

    private GitHubAppProperties liveProperties() {
        return properties(true, true, false);
    }

    private GitHubAppProperties properties(boolean enabled, boolean provisioningEnabled, boolean dryRun) {
        return new GitHubAppProperties(
                enabled,
                provisioningEnabled,
                dryRun,
                "Altaira-Labs",
                "https://api.github.test",
                "test-app-id",
                "test-client-id",
                "test-installation-id",
                "test-private-key",
                ""
        );
    }
}

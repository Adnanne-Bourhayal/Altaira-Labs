package com.altaira.backend.provisioning;

import com.altaira.backend.integration.provisioning.DriveProvider;
import com.altaira.backend.integration.provisioning.GitHubProvider;
import com.altaira.backend.integration.provisioning.JiraProvider;
import com.altaira.backend.integration.provisioning.NeonProvider;
import com.altaira.backend.integration.provisioning.ProvisioningProviderRegistry;
import com.altaira.backend.integration.provisioning.RenderProvider;
import com.altaira.backend.integration.provisioning.ResendProvider;
import com.altaira.backend.integration.provisioning.StripeProvider;
import com.altaira.backend.integration.provisioning.VercelProvider;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ProvisioningDemoSnapshotContractTests {

    private static final String CATALOG_RESOURCE = "/provisioning/provisioning-engine-scenarios.json";
    private static final String UPDATE_PROPERTY = "provisioning.snapshots.update";
    private static final String SNAPSHOT_TIME = "2026-07-21T10:00:00Z";
    private static final List<DemoMetadata> DEMOS = List.of(
            new DemoMetadata("DEMO-CLINIC", "iberia-dental", "Clinics"),
            new DemoMetadata("DEMO-DEALER", "hispano-motors", "Car Dealers"),
            new DemoMetadata("DEMO-RESTAURANT", "tapas-bistro", "Restaurants"),
            new DemoMetadata("DEMO-SPECIALTY", "asesoria-hispana", "Specialty by Sector")
    );

    private final ObjectMapper objectMapper = new ObjectMapper()
            .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS);
    private ProvisioningProviderRegistry providerRegistry;
    private ProvisioningRequirementNormalizer normalizer;
    private ProvisioningDecisionEngine engine;
    private List<ProvisioningAuditScenario> scenarios;
    private Path snapshotDirectory;

    @BeforeAll
    void prepareSnapshotHarness() throws IOException {
        assertNoRemoteDatasource();
        providerRegistry = new ProvisioningProviderRegistry(List.of(
                new GitHubProvider(),
                new VercelProvider(),
                new RenderProvider(),
                new NeonProvider(),
                new JiraProvider(),
                new DriveProvider(),
                new ResendProvider(),
                new StripeProvider()
        ));
        Assertions.assertTrue(providerRegistry.all().stream().noneMatch(provider -> provider.executionSupported()),
                "Snapshot generation must use dry-run providers only.");
        normalizer = new ProvisioningRequirementNormalizer();
        engine = new ProvisioningDecisionEngine(providerRegistry);
        scenarios = loadScenarios();
        snapshotDirectory = locateWebRepositoryRoot().resolve("lib/provisioning-demo-snapshots");
    }

    @Test
    void visualDemoSnapshotsMatchTheCurrentEngineOutput() throws IOException {
        boolean update = Boolean.getBoolean(UPDATE_PROPERTY);
        Files.createDirectories(snapshotDirectory);

        for (DemoMetadata metadata : DEMOS) {
            ProvisioningAuditScenario scenario = scenarios.stream()
                    .filter(candidate -> metadata.scenarioId().equals(candidate.id()))
                    .findFirst()
                    .orElseThrow(() -> new AssertionError("Missing demo scenario: " + metadata.scenarioId()));
            DemoSnapshot expected = buildSnapshot(metadata, scenario);
            Path snapshotPath = snapshotDirectory.resolve(metadata.slug() + ".json");

            if (update) {
                Files.writeString(
                        snapshotPath,
                        objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(expected) + System.lineSeparator(),
                        StandardCharsets.UTF_8
                );
            }

            Assertions.assertTrue(Files.isRegularFile(snapshotPath), () -> missingSnapshotMessage(snapshotPath));
            JsonNode expectedJson = objectMapper.valueToTree(expected);
            JsonNode actualJson = objectMapper.readTree(snapshotPath.toFile());
            Assertions.assertEquals(expectedJson, actualJson, () -> driftMessage(metadata, snapshotPath));
            Assertions.assertTrue(actualJson.path("plan").path("dryRun").asBoolean());
            Assertions.assertFalse(actualJson.path("plan").path("executionAllowed").asBoolean());
        }
    }

    private DemoSnapshot buildSnapshot(DemoMetadata metadata, ProvisioningAuditScenario scenario) {
        RequirementSet requirements = normalizer.normalize(
                scenario.formKey(),
                scenario.responses(),
                scenario.recommendedServices()
        );
        ProvisioningDecision decision = engine.decide(
                requirements,
                scenario.formKey(),
                scenario.responses(),
                scenario.recommendedServices(),
                scenario.name()
        );

        List<ToolSnapshot> tools = java.util.stream.IntStream.range(0, decision.tools().size())
                .mapToObj(index -> {
                    ProvisioningDecision.ToolDecision tool = decision.tools().get(index);
                    return new ToolSnapshot(
                            "fixture-tool-" + metadata.slug() + "-" + index,
                            tool.key(),
                            tool.displayName(),
                            tool.selectionState(),
                            tool.automationLevel().name(),
                            tool.required(),
                            tool.reason()
                    );
                })
                .toList();
        List<PlanItemSnapshot> items = java.util.stream.IntStream.range(0, decision.items().size())
                .mapToObj(index -> {
                    ProvisioningDecision.PlanItemDecision item = decision.items().get(index);
                    return new PlanItemSnapshot(
                            "fixture-item-" + metadata.slug() + "-" + index,
                            item.providerKey(),
                            item.resourceType(),
                            item.resourceName(),
                            item.action(),
                            "planned",
                            item.required(),
                            item.reason()
                    );
                })
                .toList();
        List<ManualStepSnapshot> manualSteps = java.util.stream.IntStream.range(0, decision.manualSteps().size())
                .mapToObj(index -> {
                    ProvisioningDecision.ManualStepDecision step = decision.manualSteps().get(index);
                    return new ManualStepSnapshot(
                            "fixture-manual-" + metadata.slug() + "-" + index,
                            step.providerKey(),
                            step.title(),
                            step.reason(),
                            step.required(),
                            "pending"
                    );
                })
                .toList();
        List<ExternalResourceSnapshot> externalResources = java.util.stream.IntStream.range(0, decision.items().size())
                .filter(index -> providerRegistry.find(decision.items().get(index).providerKey()).isPresent())
                .mapToObj(index -> {
                    ProvisioningDecision.PlanItemDecision item = decision.items().get(index);
                    return new ExternalResourceSnapshot(
                            "fixture-resource-" + metadata.slug() + "-" + index,
                            item.providerKey(),
                            item.resourceType(),
                            null,
                            null,
                            "placeholder",
                            "fixture-plan-" + metadata.slug() + ":" + item.providerKey() + ":"
                                    + item.resourceType() + ":" + index
                    );
                })
                .toList();

        PlanSnapshot plan = new PlanSnapshot(
                "fixture-plan-" + metadata.slug(),
                "fixture-lead-" + metadata.slug(),
                "fixture-assessment-" + metadata.slug(),
                decision.route().name(),
                decision.automationLevel().name(),
                decision.automationScope(),
                "draft",
                true,
                false,
                new TreeMap<>(requirements.asMap()),
                decision.reason(),
                decision.costEstimate(),
                decision.risks(),
                tools,
                items,
                manualSteps,
                externalResources,
                decision.tracks().stream().map(this::mapTrack).toList(),
                decision.sharedResources().stream().map(this::mapSharedResource).toList(),
                SNAPSHOT_TIME,
                SNAPSHOT_TIME
        );

        return new DemoSnapshot(
                1,
                scenario.id(),
                metadata.slug(),
                scenario.name(),
                metadata.sector(),
                decision.tracks().stream().map(track -> track.track().name()).toList(),
                plan
        );
    }

    private TrackSnapshot mapTrack(TrackDecision track) {
        return new TrackSnapshot(
                track.track().name(),
                track.route().name(),
                track.ruleId(),
                track.matchedSignals(),
                track.reason(),
                track.confidence(),
                track.requiresManualDecision(),
                track.automationLevel().name(),
                track.tools().stream().map(tool -> new DecisionToolSnapshot(
                        tool.key(),
                        tool.displayName(),
                        tool.selectionState(),
                        tool.automationLevel().name(),
                        tool.required(),
                        tool.reason()
                )).toList(),
                track.manualSteps().stream().map(step -> new DecisionManualStepSnapshot(
                        step.providerKey(),
                        step.title(),
                        step.reason(),
                        step.required()
                )).toList(),
                track.risks()
        );
    }

    private SharedResourceSnapshot mapSharedResource(SharedResourceDecision resource) {
        return new SharedResourceSnapshot(
                resource.key(),
                resource.displayName(),
                resource.selectionState(),
                resource.automationLevel().name(),
                resource.required(),
                resource.reason(),
                resource.usedByTracks().stream().map(Enum::name).toList()
        );
    }

    private List<ProvisioningAuditScenario> loadScenarios() throws IOException {
        try (InputStream input = getClass().getResourceAsStream(CATALOG_RESOURCE)) {
            if (input == null) {
                throw new IOException("Scenario catalog not found: " + CATALOG_RESOURCE);
            }
            ScenarioCatalog catalog = objectMapper.readValue(input, new TypeReference<>() {});
            return List.copyOf(catalog.scenarios());
        }
    }

    private void assertNoRemoteDatasource() {
        for (String key : List.of("DATABASE_URL", "SPRING_DATASOURCE_URL")) {
            String value = System.getenv(key);
            if (value == null || value.isBlank()) {
                continue;
            }
            String normalized = value.toLowerCase(java.util.Locale.ROOT);
            if (normalized.contains("neon")
                    || normalized.contains("render")
                    || normalized.contains("postgres://")
                    || normalized.contains("postgresql://")
                    || normalized.contains("jdbc:postgresql://")) {
                throw new IllegalStateException(
                        "Remote datasource detected in " + key + ". Snapshot generation aborted."
                );
            }
        }
    }

    private Path locateWebRepositoryRoot() {
        Path current = Path.of("").toAbsolutePath().normalize();
        for (Path candidate = current; candidate != null; candidate = candidate.getParent()) {
            if (Files.isDirectory(candidate.resolve("backend")) && Files.isDirectory(candidate.resolve("lib"))) {
                return candidate;
            }
        }
        throw new IllegalStateException("Altaira_Labs_web repository root could not be located from " + current);
    }

    private String missingSnapshotMessage(Path path) {
        return "Canonical snapshot is missing: " + path + ". Regenerate with -D" + UPDATE_PROPERTY + "=true.";
    }

    private String driftMessage(DemoMetadata metadata, Path path) {
        return "Provisioning visual snapshot drifted for " + metadata.scenarioId() + " (" + path + "). "
                + "Review the Engine v2 change, then regenerate intentionally with -D" + UPDATE_PROPERTY + "=true.";
    }

    private record ScenarioCatalog(int version, List<ProvisioningAuditScenario> scenarios) {}
    private record DemoMetadata(String scenarioId, String slug, String sector) {}
    private record DemoSnapshot(
            int schemaVersion,
            String scenarioId,
            String slug,
            String name,
            String sector,
            List<String> expectedTracks,
            PlanSnapshot plan
    ) {}
    private record PlanSnapshot(
            String id,
            String leadId,
            String assessmentId,
            String route,
            String automationLevel,
            String automationScope,
            String status,
            boolean dryRun,
            boolean executionAllowed,
            Map<String, Boolean> normalizedRequirements,
            String decisionReason,
            String costEstimate,
            List<String> risks,
            List<ToolSnapshot> tools,
            List<PlanItemSnapshot> items,
            List<ManualStepSnapshot> manualSteps,
            List<ExternalResourceSnapshot> externalResources,
            List<TrackSnapshot> tracks,
            List<SharedResourceSnapshot> sharedResources,
            String createdAt,
            String updatedAt
    ) {}
    private record ToolSnapshot(
            String id,
            String key,
            String displayName,
            String selectionState,
            String automationLevel,
            boolean required,
            String reason
    ) {}
    private record PlanItemSnapshot(
            String id,
            String providerKey,
            String resourceType,
            String resourceName,
            String action,
            String status,
            boolean required,
            String reason
    ) {}
    private record ManualStepSnapshot(
            String id,
            String providerKey,
            String title,
            String reason,
            boolean required,
            String status
    ) {}
    private record ExternalResourceSnapshot(
            String id,
            String providerKey,
            String resourceType,
            String externalResourceId,
            String externalUrl,
            String status,
            String idempotencyKey
    ) {}
    private record TrackSnapshot(
            String track,
            String route,
            String ruleId,
            List<String> matchedSignals,
            String reason,
            double confidence,
            boolean requiresManualDecision,
            String automationLevel,
            List<DecisionToolSnapshot> tools,
            List<DecisionManualStepSnapshot> manualSteps,
            List<String> risks
    ) {}
    private record DecisionToolSnapshot(
            String key,
            String displayName,
            String selectionState,
            String automationLevel,
            boolean required,
            String reason
    ) {}
    private record DecisionManualStepSnapshot(
            String providerKey,
            String title,
            String reason,
            boolean required
    ) {}
    private record SharedResourceSnapshot(
            String key,
            String displayName,
            String selectionState,
            String automationLevel,
            boolean required,
            String reason,
            List<String> usedByTracks
    ) {}
}

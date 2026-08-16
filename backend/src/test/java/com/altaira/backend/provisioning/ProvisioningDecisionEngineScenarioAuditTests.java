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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Stream;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ProvisioningDecisionEngineScenarioAuditTests {

    private static final String CATALOG_RESOURCE = "/provisioning/provisioning-engine-scenarios.json";
    private static final int EXPECTED_SCENARIO_COUNT = 50;
    private static final List<String> ORDERED_REQUIREMENTS = List.of(
            RequirementSet.DATABASE,
            RequirementSet.BACKEND,
            RequirementSet.FRONTEND,
            RequirementSet.STATIC_SITE,
            RequirementSet.AUTH,
            RequirementSet.CMS,
            RequirementSet.PAYMENTS,
            RequirementSet.BOOKING,
            RequirementSet.CRM,
            RequirementSet.CALENDAR,
            RequirementSet.AUTOMATION,
            RequirementSet.FILE_STORAGE,
            RequirementSet.DASHBOARD,
            RequirementSet.REALTIME,
            RequirementSet.DATA_MIGRATION,
            RequirementSet.TRAINING,
            RequirementSet.EXTERNAL_INTEGRATIONS
    );

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final List<ProvisioningScenarioAuditResult> results = new ArrayList<>();
    private List<ProvisioningAuditScenario> scenarios;
    private ProvisioningProviderRegistry providerRegistry;
    private ProvisioningRequirementNormalizer normalizer;
    private ProvisioningDecisionEngine engine;
    private Path reportPath;

    @BeforeAll
    void loadAuditHarness() throws IOException {
        scenarios = loadScenarios();
        Assertions.assertEquals(EXPECTED_SCENARIO_COUNT, scenarios.size(),
                "The audit catalog must contain the approved 46 scenarios plus four demos.");
        Assertions.assertEquals(EXPECTED_SCENARIO_COUNT,
                scenarios.stream().map(ProvisioningAuditScenario::id).collect(java.util.stream.Collectors.toSet()).size(),
                "Scenario IDs must be unique.");
        Assertions.assertEquals(4, scenarios.stream().filter(ProvisioningAuditScenario::demo).count(),
                "Exactly four priority demos are required.");

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
        normalizer = new ProvisioningRequirementNormalizer();
        engine = new ProvisioningDecisionEngine(providerRegistry);
        reportPath = locateRepositoryRoot().resolve("reports/provisioning-engine-scenario-audit.md");
    }

    @Test
    void auditHarnessUsesDryRunProvidersOnly() {
        Assertions.assertFalse(providerRegistry.all().isEmpty());
        Assertions.assertTrue(providerRegistry.all().stream().noneMatch(provider -> provider.executionSupported()),
                "An executable provider was registered in the audit-only harness.");
    }

    @Test
    void prioritySectorDemosRemainExactRegressionContracts() {
        List<ProvisioningAuditScenario> demos = scenarios.stream()
                .filter(ProvisioningAuditScenario::demo)
                .toList();

        Assertions.assertEquals(4, demos.size());
        for (ProvisioningAuditScenario scenario : demos) {
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
            ProvisioningScenarioAuditResult result = evaluate(scenario, requirements, decision);

            Assertions.assertTrue(result.passes(),
                    () -> scenario.id() + " must remain exact: " + result.mismatches());
        }
    }

    @ParameterizedTest(name = "{0} - {1}")
    @MethodSource("scenarioArguments")
    void auditsExpectedVsActual(String id, String name, ProvisioningAuditScenario scenario) {
        Assertions.assertEquals(id, scenario.id());
        Assertions.assertEquals(name, scenario.name());
        try {
            RequirementSet actualRequirements = normalizer.normalize(
                    scenario.formKey(),
                    scenario.responses(),
                    scenario.recommendedServices()
            );
            ProvisioningDecision actualDecision = engine.decide(
                    actualRequirements,
                    scenario.formKey(),
                    scenario.responses(),
                    scenario.recommendedServices(),
                    scenario.name()
            );
            assertExplainableV2Decision(actualDecision);
            results.add(evaluate(scenario, actualRequirements, actualDecision));
        } catch (RuntimeException error) {
            Assertions.fail("Unexpected audit failure in " + scenario.id() + ": " + error.getMessage(), error);
        }
    }

    Stream<Arguments> scenarioArguments() {
        return scenarios.stream().map(scenario -> Arguments.of(scenario.id(), scenario.name(), scenario));
    }

    @AfterAll
    void writeAuditReport() throws IOException {
        Assertions.assertEquals(EXPECTED_SCENARIO_COUNT, results.size(),
                "Every loaded scenario must produce an audit result.");
        ProvisioningScenarioAuditReport.write(reportPath, results);
        Assertions.assertTrue(Files.isRegularFile(reportPath), "The Markdown audit report was not generated.");
        String report = Files.readString(reportPath, StandardCharsets.UTF_8);
        Assertions.assertFalse(report.isBlank(), "The Markdown audit report is empty.");
        Assertions.assertTrue(report.contains("Total scenarios evaluated: **50**"));
        Assertions.assertFalse(containsSecretAssignment(report),
                "The generated report appears to contain a secret assignment.");
    }

    private List<ProvisioningAuditScenario> loadScenarios() throws IOException {
        try (InputStream input = getClass().getResourceAsStream(CATALOG_RESOURCE)) {
            if (input == null) {
                throw new IOException("Scenario catalog not found: " + CATALOG_RESOURCE);
            }
            ScenarioCatalog catalog = objectMapper.readValue(input, new TypeReference<>() {});
            if (catalog.scenarios() == null) {
                throw new IOException("Scenario catalog has no scenarios array.");
            }
            return List.copyOf(catalog.scenarios());
        }
    }

    private ProvisioningScenarioAuditResult evaluate(
            ProvisioningAuditScenario scenario,
            RequirementSet actualRequirements,
            ProvisioningDecision actualDecision
    ) {
        List<String> expectedRequirements = sorted(scenario.expected().requirements());
        List<String> actualRequirementKeys = ORDERED_REQUIREMENTS.stream()
                .filter(actualRequirements::has)
                .sorted()
                .toList();
        List<String> expectedTools = sorted(scenario.expected().includedTools());
        List<String> actualIncludedTools = actualDecision.tools().stream()
                .filter(tool -> "selected".equals(tool.selectionState()))
                .map(ProvisioningDecision.ToolDecision::key)
                .sorted()
                .toList();
        List<String> actualExcludedTools = actualDecision.tools().stream()
                .filter(tool -> "excluded".equals(tool.selectionState()))
                .map(ProvisioningDecision.ToolDecision::key)
                .sorted()
                .toList();
        List<String> actualManualSteps = actualDecision.manualSteps().stream()
                .map(ProvisioningDecision.ManualStepDecision::providerKey)
                .distinct()
                .sorted()
                .toList();

        List<String> mismatches = new ArrayList<>();
        if (!expectedRequirements.equals(actualRequirementKeys)) {
            mismatches.add("requirements expected=" + expectedRequirements + " actual=" + actualRequirementKeys);
        }
        if (!scenario.expected().route().equals(actualDecision.routeKey())) {
            mismatches.add("route expected=" + scenario.expected().route() + " actual=" + actualDecision.routeKey());
        }
        if (!expectedTools.equals(actualIncludedTools)) {
            mismatches.add("included tools expected=" + expectedTools + " actual=" + actualIncludedTools);
        }
        Set<String> incorrectlySelected = new LinkedHashSet<>(actualIncludedTools);
        incorrectlySelected.retainAll(new HashSet<>(scenario.expected().excludedTools()));
        if (!incorrectlySelected.isEmpty()) {
            mismatches.add("expected exclusions selected=" + sorted(incorrectlySelected));
        }
        if (!scenario.expected().automationLevel().equals(actualDecision.automationLevel().name())) {
            mismatches.add("level expected=" + scenario.expected().automationLevel()
                    + " actual=" + actualDecision.automationLevel().name());
        }
        List<String> missingManualSteps = difference(scenario.expected().manualSteps(), actualManualSteps);
        if (!missingManualSteps.isEmpty()) {
            mismatches.add("missing manual steps=" + missingManualSteps);
        }
        List<String> missingRiskKeywords = scenario.expected().riskKeywords().stream()
                .filter(keyword -> !containsIgnoreCase(actualDecision.risks(), keyword))
                .toList();
        if (!missingRiskKeywords.isEmpty()) {
            mismatches.add("missing risk coverage=" + missingRiskKeywords);
        }

        return new ProvisioningScenarioAuditResult(
                scenario,
                actualRequirementKeys,
                actualDecision.routeKey(),
                actualDecision.tracks().stream()
                        .map(track -> track.track() + "=" + track.route())
                        .toList(),
                actualDecision.tracks().stream().map(TrackDecision::ruleId).toList(),
                actualDecision.sharedResources().stream()
                        .filter(resource -> "selected".equals(resource.selectionState()))
                        .map(SharedResourceDecision::key)
                        .sorted()
                        .toList(),
                actualIncludedTools,
                actualExcludedTools,
                actualDecision.automationLevel().name(),
                actualManualSteps,
                List.copyOf(actualDecision.risks()),
                List.copyOf(mismatches)
        );
    }

    private void assertExplainableV2Decision(ProvisioningDecision decision) {
        Assertions.assertFalse(decision.tracks().isEmpty(), "Engine v2 must return at least one track.");
        for (TrackDecision track : decision.tracks()) {
            Assertions.assertNotNull(track.track());
            Assertions.assertNotNull(track.route());
            Assertions.assertFalse(track.ruleId().isBlank());
            Assertions.assertFalse(track.matchedSignals().isEmpty());
            Assertions.assertFalse(track.reason().isBlank());
            Assertions.assertTrue(track.confidence() >= 0.0 && track.confidence() <= 1.0);
            Assertions.assertNotNull(track.automationLevel());
        }
        Set<String> sharedKeys = decision.sharedResources().stream()
                .map(SharedResourceDecision::key)
                .collect(java.util.stream.Collectors.toSet());
        Assertions.assertEquals(sharedKeys.size(), decision.sharedResources().size(),
                "Shared resources must be deduplicated by key.");
    }

    private Path locateRepositoryRoot() {
        Path current = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        Path candidate = current;
        while (candidate != null) {
            boolean hasReports = Files.isDirectory(candidate.resolve("reports"));
            boolean hasWorkspace = Files.isDirectory(candidate.resolve("Altaira_Labs_web"))
                    || Files.isDirectory(candidate.resolve("backend"));
            if (hasReports && hasWorkspace) {
                return candidate;
            }
            candidate = candidate.getParent();
        }
        throw new IllegalStateException("Cannot locate repository root from " + current);
    }

    private boolean containsSecretAssignment(String report) {
        String normalized = report.toLowerCase(Locale.ROOT);
        return normalized.matches("(?s).*(api[_-]?key|password|secret|token)\\s*[=:]\\s*[^*`\\s].*");
    }

    private boolean containsIgnoreCase(List<String> values, String expectedKeyword) {
        String normalizedKeyword = expectedKeyword.toLowerCase(Locale.ROOT);
        return values.stream()
                .map(value -> value.toLowerCase(Locale.ROOT))
                .anyMatch(value -> value.contains(normalizedKeyword));
    }

    private List<String> difference(List<String> left, List<String> right) {
        List<String> result = new ArrayList<>(left);
        result.removeAll(right);
        return result;
    }

    private List<String> sorted(java.util.Collection<String> values) {
        return values.stream().sorted(Comparator.naturalOrder()).toList();
    }

    private record ScenarioCatalog(int version, List<ProvisioningAuditScenario> scenarios) {}
}

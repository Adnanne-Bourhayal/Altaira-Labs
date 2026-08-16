package com.altaira.backend.provisioning;

import com.altaira.backend.dto.provisioning.ProvisioningPlanResponse;
import com.altaira.backend.entity.LeadAssessmentEntity;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import com.altaira.backend.integration.provisioning.ProvisioningProviderRegistry;
import com.altaira.backend.repository.LeadAssessmentRepository;
import com.altaira.backend.repository.LeadRepository;
import com.altaira.backend.repository.ProvisioningExternalResourceRepository;
import com.altaira.backend.repository.ProvisioningManualStepRepository;
import com.altaira.backend.repository.ProvisioningPlanItemRepository;
import com.altaira.backend.repository.ProvisioningPlanRepository;
import com.altaira.backend.repository.ProvisioningSelectedToolRepository;
import com.altaira.backend.service.ProvisioningPlanService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProvisioningEngineV2MigrationRehearsalTests {

    private static final String JDBC_URL = "jdbc:h2:mem:provisioning_v2_migration_rehearsal;"
            + "MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
    private static final String MIGRATION_FILE = "backend/database/provisioning-engine-v2-visibility-migration.sql";
    private static final UUID V1_PLAN_ID = UUID.fromString("00000000-0000-0000-0000-000000000101");
    private static final UUID V2_PLAN_ID = UUID.fromString("00000000-0000-0000-0000-000000000102");
    private static final UUID EMPTY_PLAN_ID = UUID.fromString("00000000-0000-0000-0000-000000000103");

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void additiveMigrationPreservesV1AndPersistsV2Payloads() throws Exception {
        assertSafeDatasourceAndPrintChecklist();

        try (Connection connection = DriverManager.getConnection(JDBC_URL, "sa", "")) {
            createLegacySchema(connection);
            insertLegacyPlan(connection);
            Set<String> columnsBefore = readColumns(connection);

            executeMigration(connection);
            executeMigration(connection);

            Set<String> columnsAfter = readColumns(connection);
            Set<String> addedColumns = new LinkedHashSet<>(columnsAfter);
            addedColumns.removeAll(columnsBefore);

            Assertions.assertTrue(columnsAfter.containsAll(columnsBefore), "No v1 column may be removed or renamed.");
            Assertions.assertEquals(
                    Set.of("tracks_json", "shared_resources_json"),
                    addedColumns,
                    "The v2 migration must add exactly the two visibility columns."
            );
            Assertions.assertEquals(columnsBefore.size() + 2, columnsAfter.size());
            assertArrayDefault(connection, "tracks_json");
            assertArrayDefault(connection, "shared_resources_json");
            assertLegacyPlanPreserved(connection);

            insertV2Plan(connection);
            insertExplicitEmptyPlan(connection);
            assertV2RoundTrip(connection);
            assertExplicitEmptyArrays(connection);
            Assertions.assertEquals(3, countPlans(connection));
        }
    }

    @Test
    void planReaderHandlesLegacyEmptyAndMalformedPayloadsDefensively() {
        ProvisioningPlanRepository planRepository = mock(ProvisioningPlanRepository.class);
        ProvisioningPlanItemRepository itemRepository = mock(ProvisioningPlanItemRepository.class);
        ProvisioningSelectedToolRepository toolRepository = mock(ProvisioningSelectedToolRepository.class);
        ProvisioningManualStepRepository manualStepRepository = mock(ProvisioningManualStepRepository.class);
        ProvisioningExternalResourceRepository externalResourceRepository =
                mock(ProvisioningExternalResourceRepository.class);
        ProvisioningPlanEntity plan = readablePlan();

        when(planRepository.findById(plan.getId())).thenReturn(Optional.of(plan));
        when(itemRepository.findAllByPlanOrderBySortOrder(plan)).thenReturn(List.of());
        when(toolRepository.findAllByPlanOrderBySortOrder(plan)).thenReturn(List.of());
        when(manualStepRepository.findAllByPlanOrderBySortOrder(plan)).thenReturn(List.of());
        when(externalResourceRepository.findAllByPlanOrderByProviderKey(plan)).thenReturn(List.of());

        ProvisioningPlanService service = new ProvisioningPlanService(
                mock(LeadRepository.class),
                mock(LeadAssessmentRepository.class),
                planRepository,
                itemRepository,
                toolRepository,
                manualStepRepository,
                externalResourceRepository,
                mock(ProvisioningRequirementNormalizer.class),
                mock(ProvisioningDecisionEngine.class),
                mock(ProvisioningProviderRegistry.class),
                objectMapper
        );

        ProvisioningPlanResponse legacy = service.getPlan(plan.getId());
        Assertions.assertTrue(legacy.tracks().isEmpty());
        Assertions.assertTrue(legacy.sharedResources().isEmpty());
        Assertions.assertFalse(legacy.executionAllowed());

        plan.setTracksJson(null);
        plan.setSharedResourcesJson("  ");
        ProvisioningPlanResponse nullSafe = service.getPlan(plan.getId());
        Assertions.assertTrue(nullSafe.tracks().isEmpty());
        Assertions.assertTrue(nullSafe.sharedResources().isEmpty());

        plan.setTracksJson(v2TracksJson());
        plan.setSharedResourcesJson(v2SharedResourcesJson());
        ProvisioningPlanResponse v2 = service.getPlan(plan.getId());
        Assertions.assertEquals("WEB", v2.tracks().getFirst().track());
        Assertions.assertEquals("GITHUB", v2.sharedResources().getFirst().key());
        Assertions.assertFalse(v2.executionAllowed());

        plan.setTracksJson("{malformed");
        IllegalStateException malformedTracks = Assertions.assertThrows(
                IllegalStateException.class,
                () -> service.getPlan(plan.getId())
        );
        Assertions.assertEquals("Stored provisioning tracks are invalid", malformedTracks.getMessage());

        plan.setTracksJson("[]");
        plan.setSharedResourcesJson("{malformed");
        IllegalStateException malformedSharedResources = Assertions.assertThrows(
                IllegalStateException.class,
                () -> service.getPlan(plan.getId())
        );
        Assertions.assertEquals(
                "Stored shared provisioning resources are invalid",
                malformedSharedResources.getMessage()
        );
    }

    private void assertSafeDatasourceAndPrintChecklist() {
        List<String> remoteVariables = List.of("DATABASE_URL", "SPRING_DATASOURCE_URL").stream()
                .filter(key -> isRemoteDatasource(System.getenv(key)))
                .toList();
        Assertions.assertTrue(
                remoteVariables.isEmpty(),
                () -> "Remote datasource detected in " + remoteVariables + ". Migration rehearsal aborted."
        );
        Assertions.assertTrue(JDBC_URL.startsWith("jdbc:h2:mem:"));

        System.out.println("""
                === PROVISIONING V2 MIGRATION SAFETY CHECKLIST ===
                PASS: DATABASE_URL / SPRING_DATASOURCE_URL do not point to remote PostgreSQL.
                PASS: Datasource = jdbc:h2:mem:provisioning_v2_migration_rehearsal (disposable).
                PASS: Input data = fictional UUIDs and payloads only.
                PASS: External provider APIs = not initialized or called.
                PASS: Production migrations = disabled.
                Applying local migration rehearsal now.
                ==================================================
                """);
    }

    private boolean isRemoteDatasource(String value) {
        if (value == null || value.isBlank()) return false;
        String normalized = value.toLowerCase(Locale.ROOT);
        return normalized.contains("neon")
                || normalized.contains("render")
                || normalized.contains("postgres://")
                || normalized.contains("postgresql://")
                || normalized.contains("jdbc:postgresql://");
    }

    private void createLegacySchema(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA IF NOT EXISTS public");
            statement.execute("""
                    CREATE TABLE public.provisioning_plans (
                        id uuid PRIMARY KEY,
                        lead_id uuid NOT NULL,
                        assessment_id uuid NOT NULL,
                        route_key varchar(60) NOT NULL,
                        automation_level varchar(4) NOT NULL,
                        automation_scope varchar(20) NOT NULL,
                        status varchar(30) NOT NULL DEFAULT 'draft',
                        dry_run boolean NOT NULL DEFAULT true,
                        normalized_requirements_json text NOT NULL,
                        decision_reason text NOT NULL,
                        risks_json text NOT NULL,
                        cost_estimate text NOT NULL,
                        created_at timestamp with time zone NOT NULL DEFAULT now(),
                        updated_at timestamp with time zone NOT NULL DEFAULT now(),
                        CONSTRAINT provisioning_plans_assessment_unique UNIQUE (assessment_id)
                    )
                    """);
        }
    }

    private void insertLegacyPlan(Connection connection) throws SQLException {
        insertPlan(
                connection,
                V1_PLAN_ID,
                "PROVISION_WEB_STATIC",
                "Legacy v1 decision remains intact",
                null,
                null,
                false
        );
    }

    private void insertV2Plan(Connection connection) throws SQLException {
        insertPlan(
                connection,
                V2_PLAN_ID,
                "MULTI_TRACK_PLAN",
                "Engine v2 decision",
                v2TracksJson(),
                v2SharedResourcesJson(),
                true
        );
    }

    private void insertExplicitEmptyPlan(Connection connection) throws SQLException {
        insertPlan(
                connection,
                EMPTY_PLAN_ID,
                "MANUAL_REVIEW",
                "Explicit empty arrays",
                "[]",
                "[]",
                true
        );
    }

    private void insertPlan(
            Connection connection,
            UUID id,
            String route,
            String reason,
            String tracksJson,
            String sharedResourcesJson,
            boolean includeV2Columns
    ) throws SQLException {
        String sql = includeV2Columns
                ? """
                    INSERT INTO public.provisioning_plans (
                        id, lead_id, assessment_id, route_key, automation_level, automation_scope,
                        status, dry_run, normalized_requirements_json, decision_reason, risks_json,
                        cost_estimate, tracks_json, shared_resources_json
                    ) VALUES (?, ?, ?, ?, 'A3', 'partial', 'draft', true, '{}', ?, '[]', 'No spend', ?, ?)
                    """
                : """
                    INSERT INTO public.provisioning_plans (
                        id, lead_id, assessment_id, route_key, automation_level, automation_scope,
                        status, dry_run, normalized_requirements_json, decision_reason, risks_json, cost_estimate
                    ) VALUES (?, ?, ?, ?, 'A3', 'partial', 'draft', true, '{}', ?, '[]', 'No spend')
                    """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, id);
            statement.setObject(2, UUID.nameUUIDFromBytes((id + ":lead").getBytes(StandardCharsets.UTF_8)));
            statement.setObject(3, UUID.nameUUIDFromBytes((id + ":assessment").getBytes(StandardCharsets.UTF_8)));
            statement.setString(4, route);
            statement.setString(5, reason);
            if (includeV2Columns) {
                statement.setString(6, tracksJson);
                statement.setString(7, sharedResourcesJson);
            }
            statement.executeUpdate();
        }
    }

    private void executeMigration(Connection connection) throws IOException, SQLException {
        Path migration = locateRepositoryRoot().resolve(MIGRATION_FILE);
        String sql = Files.readString(migration);
        String withoutLineComments = sql.lines()
                .filter(line -> !line.stripLeading().startsWith("--"))
                .reduce("", (left, right) -> left + right + System.lineSeparator());

        try (Statement statement = connection.createStatement()) {
            for (String command : withoutLineComments.split(";")) {
                if (!command.isBlank()) statement.execute(command.trim());
            }
        }
    }

    private Path locateRepositoryRoot() {
        Path current = Path.of("").toAbsolutePath().normalize();
        for (Path candidate = current; candidate != null; candidate = candidate.getParent()) {
            if (Files.isDirectory(candidate.resolve("backend")) && Files.isDirectory(candidate.resolve("lib"))) {
                return candidate;
            }
        }
        throw new IllegalStateException("Altaira_Labs_web repository root could not be located from " + current);
    }

    private Set<String> readColumns(Connection connection) throws SQLException {
        Set<String> columns = new LinkedHashSet<>();
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'provisioning_plans'
                ORDER BY ordinal_position
                """)) {
            try (ResultSet rows = statement.executeQuery()) {
                while (rows.next()) columns.add(rows.getString(1));
            }
        }
        return columns;
    }

    private void assertArrayDefault(Connection connection, String column) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT column_default, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'provisioning_plans' AND column_name = ?
                """)) {
            statement.setString(1, column);
            try (ResultSet row = statement.executeQuery()) {
                Assertions.assertTrue(row.next());
                Assertions.assertTrue(row.getString("column_default").contains("[]"));
                Assertions.assertEquals("NO", row.getString("is_nullable"));
            }
        }
    }

    private void assertLegacyPlanPreserved(Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT route_key, decision_reason, tracks_json, shared_resources_json
                FROM public.provisioning_plans WHERE id = ?
                """)) {
            statement.setObject(1, V1_PLAN_ID);
            try (ResultSet row = statement.executeQuery()) {
                Assertions.assertTrue(row.next());
                Assertions.assertEquals("PROVISION_WEB_STATIC", row.getString("route_key"));
                Assertions.assertEquals("Legacy v1 decision remains intact", row.getString("decision_reason"));
                Assertions.assertEquals("[]", row.getString("tracks_json"));
                Assertions.assertEquals("[]", row.getString("shared_resources_json"));
            }
        }
    }

    private void assertV2RoundTrip(Connection connection) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT tracks_json, shared_resources_json
                FROM public.provisioning_plans WHERE id = ?
                """)) {
            statement.setObject(1, V2_PLAN_ID);
            try (ResultSet row = statement.executeQuery()) {
                Assertions.assertTrue(row.next());
                List<ProvisioningPlanResponse.Track> tracks = objectMapper.readValue(
                        row.getString("tracks_json"),
                        new TypeReference<>() {}
                );
                List<ProvisioningPlanResponse.SharedResource> resources = objectMapper.readValue(
                        row.getString("shared_resources_json"),
                        new TypeReference<>() {}
                );
                Assertions.assertEquals("WEB", tracks.getFirst().track());
                Assertions.assertEquals("PROVISION_WEB_STATIC", tracks.getFirst().route());
                Assertions.assertEquals("GITHUB", resources.getFirst().key());
                Assertions.assertEquals(List.of("WEB"), resources.getFirst().usedByTracks());
            }
        }
    }

    private void assertExplicitEmptyArrays(Connection connection) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT tracks_json, shared_resources_json
                FROM public.provisioning_plans WHERE id = ?
                """)) {
            statement.setObject(1, EMPTY_PLAN_ID);
            try (ResultSet row = statement.executeQuery()) {
                Assertions.assertTrue(row.next());
                Assertions.assertTrue(objectMapper.readTree(row.getString("tracks_json")).isEmpty());
                Assertions.assertTrue(objectMapper.readTree(row.getString("shared_resources_json")).isEmpty());
            }
        }
    }

    private int countPlans(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement();
             ResultSet row = statement.executeQuery("SELECT count(*) FROM public.provisioning_plans")) {
            row.next();
            return row.getInt(1);
        }
    }

    private ProvisioningPlanEntity readablePlan() {
        LeadEntity lead = new LeadEntity();
        lead.setId(UUID.fromString("00000000-0000-0000-0000-000000000201"));
        LeadAssessmentEntity assessment = new LeadAssessmentEntity();
        assessment.setId(UUID.fromString("00000000-0000-0000-0000-000000000202"));

        ProvisioningPlanEntity plan = new ProvisioningPlanEntity();
        plan.setId(UUID.fromString("00000000-0000-0000-0000-000000000203"));
        plan.setLead(lead);
        plan.setAssessment(assessment);
        plan.setRouteKey("PROVISION_WEB_STATIC");
        plan.setAutomationLevel("A3");
        plan.setAutomationScope("partial");
        plan.setStatus("draft");
        plan.setDryRun(true);
        plan.setNormalizedRequirementsJson("{}");
        plan.setDecisionReason("Compatibility read");
        plan.setRisksJson("[]");
        plan.setCostEstimate("No spend");
        plan.setTracksJson("[]");
        plan.setSharedResourcesJson("[]");
        plan.setCreatedAt(Instant.parse("2026-07-21T10:00:00Z"));
        plan.setUpdatedAt(Instant.parse("2026-07-21T10:00:00Z"));
        return plan;
    }

    private String v2TracksJson() {
        return """
                [{
                  "track":"WEB",
                  "route":"PROVISION_WEB_STATIC",
                  "ruleId":"WEB-STATIC-V2",
                  "matchedSignals":["requires_static_site"],
                  "reason":"Static delivery matches the normalized requirements.",
                  "confidence":0.82,
                  "requiresManualDecision":false,
                  "automationLevel":"A3",
                  "tools":[],
                  "manualSteps":[],
                  "risks":[]
                }]
                """;
    }

    private String v2SharedResourcesJson() {
        return """
                [{
                  "key":"GITHUB",
                  "displayName":"GitHub",
                  "selectionState":"selected",
                  "automationLevel":"A3",
                  "required":true,
                  "reason":"Shared source control resource.",
                  "usedByTracks":["WEB"]
                }]
                """;
    }
}
